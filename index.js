console.clear();
console.log('Starting Server: Broadcast JSON + Auto Scraping + Auto Logout + Anti-Timer + Auto Block/Disconnect...');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    delay,
    proto,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} = require("@whiskeysockets/baileys");

const pino = require('pino');
const fs = require('fs');
const express = require("express");
const cors = require("cors");
const path = require("path");
const rimraf = require("rimraf");
const crypto = require('crypto');
const cron = require('node-cron'); 
const axios = require('axios'); 

const app = express();
const PORT = process.env.PORT || 5036;

// --- KONFIGURASI TELEGRAM ---
const TELEGRAM_BOT_TOKEN = '7988999694:AAHrCuGm1SqJUjaBb7ZX2zvNm4Aa_WSOki4'; 
const TELEGRAM_CHAT_ID = '6897791527'; 
// ----------------------------

// --- CONFIGURATION ---
const MAX_SESSIONS = 99;
const SESSION_DIR = path.join(__dirname, 'sessions');
const DATA_FILE = path.join(__dirname, 'number.json'); 
const MESSAGE_FILE = path.join(__dirname, 'message.json'); 
const LOG_FILE = path.join(__dirname, 'broadcast_log.json'); 
const ID_MAPPING_FILE = path.join(__dirname, 'id_mapping.json'); 

const BACKUP_FILES = [DATA_FILE, MESSAGE_FILE, LOG_FILE, ID_MAPPING_FILE];

const sessionsMap = new Map();
const broadcastStatus = new Map(); 

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]'); 
if (!fs.existsSync(MESSAGE_FILE)) fs.writeFileSync(MESSAGE_FILE, '{}');
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '{}'); 
if (!fs.existsSync(ID_MAPPING_FILE)) fs.writeFileSync(ID_MAPPING_FILE, '{}'); 

// --- HELPER FUNCTIONS ---

function generateSessionId() {
    return Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

function loadIdMapping() {
    if (!fs.existsSync(ID_MAPPING_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(ID_MAPPING_FILE, 'utf-8')); } catch (e) { return {}; }
}

function saveIdMapping(mapping) {
    fs.writeFileSync(ID_MAPPING_FILE, JSON.stringify(mapping, null, 2));
}

function updateIdMapping(sessionId, number, status) {
    const mapping = loadIdMapping();
    const formattedNumber = number.toString().replace(/[^0-9]/g, '');
    const now = new Date().toISOString();

    mapping[formattedNumber] = {
        currentSessionId: sessionId,
        phoneNumber: formattedNumber,
        status: status,
        sessionFolder: sessionId,
        lastUpdated: now
    };
    saveIdMapping(mapping);
    console.log(`[ID_MAPPING] Updated for ${formattedNumber}. Status: ${status} at ${now}`);
}

function removeIdMapping(formattedNumber) {
    const mapping = loadIdMapping();
    if (mapping[formattedNumber]) {
        delete mapping[formattedNumber];
        saveIdMapping(mapping);
    }
}

function logBroadcast(sessionId, number, status, reason = "", messageConfig = {}) {
    let logs = {};
    if (fs.existsSync(LOG_FILE)) {
        try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch(e) { logs = {} }
    }
    if (!logs[sessionId]) logs[sessionId] = [];
    
    logs[sessionId].push({
        target: number,
        status: status,
        reason: reason,
        timestamp: new Date().toISOString(),
        broadcast_message_preview: messageConfig.message ? messageConfig.message.substring(0, 50) + '...' : 'N/A',
        config_title: messageConfig.title || 'N/A'
    });
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

function getBroadcastStatsBySessionId(sessionId) {
    if (!fs.existsSync(LOG_FILE)) return { sent: 0, failed: 0, total: 0, details: [], sessionId: sessionId };
    let logs = {};
    try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch(e) { logs = {} }
    const sessionLogs = logs[sessionId] || [];
    
    let sent = 0; let failed = 0; const details = [];
    sessionLogs.forEach(log => {
        if (log.status === "success") sent++;
        else if (log.status === "failed") failed++;
        details.push(log);
    });

    return { sessionId, sent, failed, total: sessionLogs.length, details };
}

function getSuccessfulTargetsForSession(sessionId) {
    if (!fs.existsSync(LOG_FILE)) return new Set();
    let logs = {};
    try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch(e) { return new Set(); }
    const sessionLogs = logs[sessionId] || [];
    const successfulTargets = new Set();
    sessionLogs.forEach(log => {
        if (log.status === "success") successfulTargets.add(log.target);
    });
    return successfulTargets;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getDelay(speed) {
    switch (speed) {
        case 'very_fast': return Math.floor(Math.random() * 1000) + 500;
        case 'fast':      return Math.floor(Math.random() * 3000) + 2000;
        case 'slow':      return Math.floor(Math.random() * 5000) + 5000;
        case 'very_slow': return Math.floor(Math.random() * 30000) + 20000;
        default:          return Math.floor(Math.random() * 3000) + 2000;
    }
}

function formatToJid(number) {
    let formatted = number.toString().replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) formatted = '62' + formatted.slice(1);
    return formatted + '@s.whatsapp.net';
}

// FUNGSI saveScrapedNumbers DIHAPUS

/**
 * --- FITUR: FORCE LOGOUT DENGAN STATUS CUSTOM ---
 * statusReason: "Diblokir" (Untuk Timer/Revoke) atau "Disconnect" (Untuk Error/Logout).
 */
async function forceLogout(sessionId, reasonStatus) {
    console.log(`[${sessionId}] ⚠️ FORCE LOGOUT TRIGGERED! Reason Status: ${reasonStatus}`);
    const client = sessionsMap.get(sessionId);
    let numberToUpdate = null;

    if (client) {
        // Ambil nomor sebelum klien dimatikan
        numberToUpdate = client.user?.id?.split(':')[0]?.split('@')[0];
        try {
            // Coba tutup socket dengan baik
            client.end(undefined);
        } catch (e) {}
        sessionsMap.delete(sessionId);
    } else {
        // Cari nomor dari file mapping jika client sudah null
        const mapping = loadIdMapping();
        for (const num in mapping) {
            if (mapping[num].currentSessionId === sessionId) {
                numberToUpdate = num;
                break;
            }
        }
    }
    
    // 1. UPDATE STATUS DI MAPPING
    if (numberToUpdate) {
        updateIdMapping(sessionId, numberToUpdate, reasonStatus); 
        console.log(`[${sessionId}] Status nomor ${numberToUpdate} diubah menjadi: ${reasonStatus}`);
    }

    // 2. HAPUS FOLDER SESI
    const sessionPath = path.join(SESSION_DIR, sessionId);
    if (fs.existsSync(sessionPath)) {
        rimraf.sync(sessionPath);
        console.log(`[${sessionId}] Session folder deleted.`);
    }

    // 3. STOP BROADCAST JIKA ADA
    if (broadcastStatus.get(sessionId)) {
        broadcastStatus.set(sessionId, "canceled");
    }
}

// --- CORE SESSION ---
async function startSession(sessionId) {
    const sessionPath = path.join(SESSION_DIR, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const client = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        markOnlineOnConnect: true
    });

    sessionsMap.set(sessionId, client);
    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`[${sessionId}] Connection closed: ${reason}`);

            // --- DETEKSI LOGGED OUT / BANNED / KONEKSI TERPUTUS ---
            // Sesuai request: Jika Logout/Banned/Error, status jadi "Disconnect"
            if (reason === DisconnectReason.loggedOut || reason === 403 || reason === 401) {
                console.log(`[${sessionId}] ❌ DETECTED: Logged Out or Connection Lost (Code: ${reason}). Marking as 'Disconnect'.`);
                await forceLogout(sessionId, "Disconnect");
            } else {
                console.log(`[${sessionId}] Reconnecting...`);
                sessionsMap.delete(sessionId); 
                await delay(3000); 
                startSession(sessionId);
            }
        } else if (connection === 'open') {
            console.log(`[${sessionId}] Connected!`);
            const number = client.user?.id.split(':')[0].split('@')[0];

            if (number) {
                updateIdMapping(sessionId, number, "Connected");
            }
            
            // --- CEK TIMER (DISAPPEARING MESSAGES) ---
            try {
                console.log(`[${sessionId}] Checking Privacy Settings (Anti-Timer)...`);
                const privacy = await client.fetchPrivacySettings(true); 
                
                const timerDuration = privacy.defaultDisappearingMode?.ephemeralExpiration || 
                                      privacy.defaultDisappearingMode || 0;
                
                // Jika timerDuration AKTIF (bukan OFF dan > 0) -> Status "Diblokir"
                if (timerDuration !== 'OFF' && timerDuration > 0) {
                     console.log(`[${sessionId}] ⚠️ WARNING: TIMER DETECTED (${timerDuration})! Auto Blocking Session.`);
                     
                     // Kirim pesan peringatan (Opsional)
                     await client.sendMessage(client.user.id, { text: "⚠️ Sistem Mendeteksi Timer Pesan Sementara Aktif. Sesi otomatis diblokir." });
                     await delay(2000);

                     // FORCE LOGOUT -> "Diblokir"
                     await forceLogout(sessionId, "Diblokir"); 
                     return; 
                } else {
                    console.log(`[${sessionId}] Privacy Check OK. Timer is OFF.`);
                }
            } catch (err) {
                console.error(`[${sessionId}] Failed to check privacy settings (Non-Fatal):`, err.message);
            }
            // -----------------------------------------------------

            // --- FITUR SCRAPING GROUP (TELAH DIHAPUS) ---
            // Kode scraping group sebelumnya ada di sini dan telah dihapus.
        }
    });

    // --- DETEKSI PESAN DIHAPUS (REVOKE) ---
    // Jika pesan dihapus -> Status "Diblokir"
    client.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            if (update.update.messageStubType === proto.WebMessageInfo.StubType.REVOKE && update.key.fromMe) {
                console.log(`[${sessionId}] DETECTED: Message revoked! Triggering Auto Block.`);
                await forceLogout(sessionId, "Diblokir");
            }
        }
    });

    return client;
}

// --- INIT ---
async function initActiveSessions() {
    if (!fs.existsSync(SESSION_DIR)) return;
    const files = fs.readdirSync(SESSION_DIR);
    for (const file of files) {
        const fullPath = path.join(SESSION_DIR, file);
        if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'creds.json'))) {
            await startSession(file);
        }
    }
}

// --- BACKUP FUNCTION ---
async function sendBackupToTelegram(filePath) {
    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE') return;
    const fileName = path.basename(filePath);
    const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
    try {
        const fileContent = fs.readFileSync(filePath);
        const form = new FormData();
        form.append('chat_id', TELEGRAM_CHAT_ID);
        form.append('document', new Blob([fileContent], { type: 'application/json' }), fileName);
        form.append('caption', `[AUTO BACKUP] ${fileName} - ${new Date().toISOString()}`);
        await axios.post(apiUrl, form, { headers: { ...form.getHeaders ? form.getHeaders() : {} } });
    } catch (error) { }
}

function setupCronJob() {
    cron.schedule('0 0 * * *', async () => {
        for (const f of BACKUP_FILES) if (fs.existsSync(f)) await sendBackupToTelegram(f);
    }, { scheduled: true, timezone: "Asia/Jakarta" });
}

// --- ENDPOINTS ---

app.post("/api/pair", async (req, res) => {
    let { number } = req.body; 
    if (!number) return res.status(400).json({ status: false, message: "Nomor diperlukan" });
    number = number.toString().replace(/[^0-9]/g, '');
    if (number.startsWith('0')) number = '62' + number.slice(1);

    if (sessionsMap.size >= MAX_SESSIONS) return res.status(403).json({ message: "Sesi Maksimum Tercapai." });

    const mapping = loadIdMapping();
    if (mapping[number] && mapping[number].status !== "Logged Out" && mapping[number].status !== "Disconnect" && mapping[number].status !== "Diblokir") {
         return res.status(400).json({ status: false, message: `Nomor ${number} aktif (${mapping[number].status}).` });
    }

    const sessionId = generateSessionId();
    try {
        let client = await startSession(sessionId);
        await delay(3000);
        if (client.authState.creds.registered) {
            updateIdMapping(sessionId, number, "Connected");
            return res.status(200).json({ status: true, sessionId, message: "Sesi sudah terdaftar." });
        }
        const code = await client.requestPairingCode(number);
        updateIdMapping(sessionId, number, "Pairing"); 
        res.json({ status: true, sessionId, code });
    } catch (err) {
        sessionsMap.delete(sessionId);
        const sessionPath = path.join(SESSION_DIR, sessionId);
        if (fs.existsSync(sessionPath)) rimraf.sync(sessionPath);
        removeIdMapping(number);
        res.status(500).json({ status: false, message: "Internal Error", error: err.message });
    }
});

app.get("/api/sessions", (req, res) => {
    const active = [];
    const mapping = loadIdMapping();
    const now = Date.now();
    for (const number in mapping) {
        const entry = mapping[number];
        const sessionId = entry.currentSessionId;
        const client = sessionsMap.get(sessionId);
        let displayStatus = entry.status;

        if (entry.status === "Pairing") {
            if (now - new Date(entry.lastUpdated).getTime() > 300000) { // 5 min timeout
                rimraf.sync(path.join(SESSION_DIR, sessionId));
                if (client) { client.end(undefined); sessionsMap.delete(sessionId); }
                removeIdMapping(number);
                continue;
            }
            displayStatus = "Pairing (Active)";
        } 
        
        if (client && client.authState.creds.registered) displayStatus = "Connected";
        
        if (["Connected", "Pairing (Active)", "Diblokir", "Reconnecting", "Disconnect"].includes(displayStatus)) {
             active.push({ 
                sessionId, 
                status: displayStatus, 
                number, 
                sessionFolder: sessionId,
                isBroadcasting: broadcastStatus.get(sessionId) === "running" 
            });
        }
    }
    res.json({ total: active.length, sessions: active });
});

app.get("/api/message-config", (req, res) => {
    if (fs.existsSync(MESSAGE_FILE)) res.json(JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf-8')));
    else res.json({});
});

app.post("/api/save-message", (req, res) => {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(req.body, null, 2));
    res.json({ status: true });
});

app.get("/api/data-numbers", (req, res) => res.json({ status: true, numbers: JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8') || '[]') }));
app.get("/api/id-mapping", (req, res) => res.json({ status: true, mapping: loadIdMapping() }));

app.post("/api/cek-terkirim", (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ status: false });
    const stats = getBroadcastStatsBySessionId(sessionId);
    res.json({ status: true, stats: { total: stats.total, success: stats.sent, failed: stats.failed }, history: stats.details });
});

app.post("/api/cancel-broadcast", (req, res) => {
    const { sessionId } = req.body;
    if (broadcastStatus.get(sessionId) === "running") {
        broadcastStatus.set(sessionId, "canceled");
        res.json({ status: true, message: "Canceling..." });
    } else res.status(404).json({ status: false });
});

app.post("/api/broadcast", async (req, res) => {
    const { sessionId, speed } = req.body;
    if (!sessionId) return res.status(400).json({ message: "Session ID required" });
    
    // Cek apakah client hidup
    const client = sessionsMap.get(sessionId);
    if (!client) {
        // Jika client mati/tidak ada sesi -> Status "Disconnect"
        await forceLogout(sessionId, "Disconnect"); 
        return res.status(404).json({ message: "Session not active/disconnected." });
    }

    if (broadcastStatus.get(sessionId) === "running") return res.status(400).json({ status: false, message: "Busy." });

    if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ message: "No DB" });
    let targets = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8') || '[]');
    let msgConfig = JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf-8') || '{}');
    
    const successfullySentNumbers = getSuccessfulTargetsForSession(sessionId);
    let filteredTargets = targets.filter(number => !successfullySentNumbers.has(number));
    if (filteredTargets.length === 0) return res.status(400).json({ status: false, message: "Done." });

    filteredTargets = shuffleArray(filteredTargets);
    broadcastStatus.set(sessionId, "running");
    
    res.json({ status: true, message: `Started to ${filteredTargets.length} numbers.` });

    // Prepare Media
    let headerMessage = { title: msgConfig.title || "Info", subtitle: "Broadcast", hasMediaAttachment: false };
    if (msgConfig.media_url) {
        try {
            const media = await prepareWAMessageMedia({ [msgConfig.media_type]: { url: msgConfig.media_url } }, { upload: client.waUploadToServer });
            headerMessage = { ...media, title: msgConfig.title, subtitle: "Info", hasMediaAttachment: true };
        } catch (e) { console.error("Media Error:", e.message); }
    }

    for (const number of filteredTargets) {
        if (broadcastStatus.get(sessionId) === "canceled") break;
        
        try {
            // --- CEK KONEKSI SEBELUM KIRIM ---
            if (!client.user) {
                 throw new Error("Client user is undefined (Session Dead)");
            }
            
            const jid = formatToJid(number);
            const msgContent = generateWAMessageFromContent(jid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: {
                            body: { text: msgConfig.message },
                            footer: { text: msgConfig.footer },
                            header: headerMessage,
                            nativeFlowMessage: {
                                buttons: [{
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({ display_text: msgConfig.btn_text, url: msgConfig.btn_url, merchant_url: msgConfig.btn_url })
                                }]
                            }
                        }
                    }
                }
            }, { userJid: client.user.id });

            await client.relayMessage(jid, msgContent.message, { messageId: msgContent.key.id });
            console.log(`[${sessionId}] Sent -> ${number}`);
            logBroadcast(sessionId, number, "success", "", msgConfig);

        } catch (e) {
            console.log(`[${sessionId}] Fail -> ${number}: ${e.message}`);
            logBroadcast(sessionId, number, "failed", e.message, msgConfig);
            
            // --- AUTO DISCONNECT JIKA ERROR FATAL SAAT BROADCAST ---
            const errorMsg = e.message ? e.message.toLowerCase() : "";
            const statusCode = e?.output?.statusCode;
            
            const isFatal = 
                errorMsg.includes('connection closed') || 
                errorMsg.includes('stream errored') ||
                errorMsg.includes('unauthorized') || // 401
                statusCode === 401 ||
                statusCode === 403 || 
                errorMsg.includes('client user is undefined');

            if (isFatal) {
                console.log(`[${sessionId}] 🚨 FATAL BROADCAST ERROR! Connection dead. Marking as 'Disconnect'.`);
                
                // Stop Loop
                broadcastStatus.set(sessionId, "canceled"); 
                // Force Logout -> "Disconnect" (Karena error fatal/putus)
                await forceLogout(sessionId, "Disconnect"); 
                break; 
            }
            // -------------------------------------------------------------
        }
        await delay(getDelay(speed));
    }
    
    if (broadcastStatus.get(sessionId) !== "canceled") broadcastStatus.delete(sessionId);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initActiveSessions();
    setupCronJob();
});
