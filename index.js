console.clear();
console.log('Starting Server: Broadcast JSON + Auto Scraping + Auto Logout...');

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

const app = express();
const PORT = process.env.PORT || 5036;

// --- CONFIGURATION ---
const MAX_SESSIONS = 99;
const SESSION_DIR = path.join(__dirname, 'sessions');
const DATA_FILE = path.join(__dirname, 'number.json'); // File Database Nomor Target
const MESSAGE_FILE = path.join(__dirname, 'message.json'); // File Konfigurasi Pesan
const LOG_FILE = path.join(__dirname, 'broadcast_log.json'); // File Log Broadcast
const ID_MAPPING_FILE = path.join(__dirname, 'id_mapping.json'); // File Pemetaan ID BARU

const sessionsMap = new Map();
// MAP BARU: Melacak status siaran per sesi
const broadcastStatus = new Map(); 

// Middleware
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Inisialisasi file
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]'); 
if (!fs.existsSync(MESSAGE_FILE)) fs.writeFileSync(MESSAGE_FILE, '{}');
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '{}'); 
if (!fs.existsSync(ID_MAPPING_FILE)) fs.writeFileSync(ID_MAPPING_FILE, '{}'); // Init file baru

// --- HELPER FUNCTIONS ---

function generateSessionId() {
    return Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

// Helper untuk membaca dan menyimpan ID Mapping
function loadIdMapping() {
    if (!fs.existsSync(ID_MAPPING_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(ID_MAPPING_FILE, 'utf-8')); } catch (e) { return {}; }
}

function saveIdMapping(mapping) {
    fs.writeFileSync(ID_MAPPING_FILE, JSON.stringify(mapping, null, 2));
}

/**
 * Memperbarui pemetaan nomor telepon ke sessionId.
 * @param {string} sessionId ID sesi (sekaligus nama folder)
 * @param {string} number Nomor telepon (62xxxxxxxx)
 * @param {string} status Status sesi (Connected, Pairing, Disconnected, Logged Out)
 */
function updateIdMapping(sessionId, number, status) {
    const mapping = loadIdMapping();
    const formattedNumber = number.toString().replace(/[^0-9]/g, '');

    mapping[formattedNumber] = {
        currentSessionId: sessionId, // ID sesi aktif saat ini
        phoneNumber: formattedNumber,
        status: status,
        sessionFolder: sessionId, // Folder sesi sama dengan sessionId
        lastUpdated: new Date().toISOString()
    };
    saveIdMapping(mapping);
    console.log(`[ID_MAPPING] Updated for ${formattedNumber}. Status: ${status}`);
}

/**
 * Menghapus pemetaan berdasarkan nomor telepon.
 * @param {string} formattedNumber Nomor telepon (62xxxxxxxx)
 */
function removeIdMapping(formattedNumber) {
    const mapping = loadIdMapping();
    if (mapping[formattedNumber]) {
        delete mapping[formattedNumber];
        saveIdMapping(mapping);
        console.log(`[ID_MAPPING] Removed entry for ${formattedNumber}.`);
    }
}


/**
 * Log detail broadcast, termasuk preview pesan yang dikirim.
 * Log ini bersifat APPEND (menambah data ke array), tidak menimpa.
 */
function logBroadcast(sessionId, number, status, reason = "", messageConfig = {}) {
    let logs = {};
    if (fs.existsSync(LOG_FILE)) {
        try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch(e) { logs = {} }
    }
    
    // Pastikan log untuk sessionId ini adalah array
    if (!logs[sessionId]) logs[sessionId] = [];
    
    logs[sessionId].push({
        target: number,
        status: status,
        reason: reason,
        timestamp: new Date().toISOString(),
        // Detail pesan yang dikirim saat itu (untuk pelacakan riwayat)
        broadcast_message_preview: messageConfig.message ? messageConfig.message.substring(0, 50) + '...' : 'N/A',
        config_title: messageConfig.title || 'N/A'
    });
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

/**
 * Mengambil statistik broadcast berdasarkan NOMOR TARGET (fungsi lama, dipertahankan sebagai utilitas).
 * @param {string} targetNumber Nomor telepon target (62xxxxxxxx)
 */
function getBroadcastStatsByTargetNumber(targetNumber) {
    if (!fs.existsSync(LOG_FILE)) return { sent: 0, failed: 0, total: 0, details: [], target_number: targetNumber };

    let logs = {};
    try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch(e) { logs = {} }

    let sent = 0;
    let failed = 0;
    const details = [];
    let totalAttempts = 0;
    
    for (const sessionId in logs) {
        const sessionLogs = logs[sessionId] || [];

        sessionLogs.forEach(log => {
            let logTarget = log.target.toString().replace(/[^0-9]/g, '');
            if (logTarget.startsWith('0')) logTarget = '62' + logTarget.slice(1);

            if (logTarget === targetNumber) {
                totalAttempts++;
                if (log.status === "success") {
                    sent++;
                } else if (log.status === "failed") {
                    failed++;
                }
                
                details.push({
                    session: sessionId, 
                    status: log.status,
                    reason: log.reason,
                    timestamp: log.timestamp,
                    // Tambahkan detail pesan ke riwayat cek-terkirim
                    message_preview: log.broadcast_message_preview,
                    config_title: log.config_title
                });
            }
        });
    }

    return {
        target_number: targetNumber,
        sent: sent,
        failed: failed,
        total: totalAttempts,
        details: details
    };
}


/**
 * Fungsi BARU: Mengambil statistik broadcast HANYA berdasarkan SESSION ID pengirim.
 * @param {string} sessionId ID Sesi (nama folder)
 */
function getBroadcastStatsBySessionId(sessionId) {
    if (!fs.existsSync(LOG_FILE)) return { sent: 0, failed: 0, total: 0, details: [], sessionId: sessionId };

    let logs = {};
    try { logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch(e) { logs = {} }

    // Ambil log hanya untuk sesi yang diminta
    const sessionLogs = logs[sessionId] || [];
    
    let sent = 0;
    let failed = 0;
    const details = [];

    sessionLogs.forEach(log => {
        if (log.status === "success") {
            sent++;
        } else if (log.status === "failed") {
            failed++;
        }
        
        // Log detail hanya berisi informasi yang relevan untuk sesi tersebut
        details.push({
            target_number: log.target,
            status: log.status,
            reason: log.reason,
            timestamp: log.timestamp,
            message_preview: log.broadcast_message_preview,
            config_title: log.config_title
        });
    });

    return {
        sessionId: sessionId,
        sent: sent,
        failed: failed,
        total: sessionLogs.length,
        details: details
    };
}


/**
 * Mengambil set nomor target yang sudah berhasil dikirimi pesan
 * untuk sesi tertentu dari LOG_FILE.
 * @param {string} sessionId
 * @returns {Set<string>} Set nomor telepon yang sukses terkirim.
 */
function getSuccessfulTargetsForSession(sessionId) {
    if (!fs.existsSync(LOG_FILE)) return new Set();
    let logs = {};
    try {
        // Baca seluruh log file
        logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch(e) { 
        console.error("Error reading LOG_FILE for filtering:", e);
        return new Set();
    }
    
    // Ambil log hanya untuk sesi yang diminta
    const sessionLogs = logs[sessionId] || [];
    const successfulTargets = new Set();

    sessionLogs.forEach(log => {
        // Hanya tambahkan nomor yang status pengiriman terakhirnya 'success'
        if (log.status === "success") {
            successfulTargets.add(log.target);
        }
    });

    return successfulTargets;
}

// Implementasi Fisher-Yates (Knuth) Shuffle untuk pengacakan array
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

async function saveScrapedNumbers(newNumbers) {
    let currentData = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            currentData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        } catch (e) { currentData = []; }
    }
    const uniqueSet = new Set([...currentData, ...newNumbers]);
    const finalArray = Array.from(uniqueSet);
    fs.writeFileSync(DATA_FILE, JSON.stringify(finalArray, null, 2));
    console.log(`[DATABASE] Total numbers saved: ${finalArray.length} (+${newNumbers.length} new)`);
}

async function forceLogout(sessionId) {
    console.log(`[${sessionId}] TRIGGER: Message Deleted by User -> Force Logout & Delete Session.`);
    const client = sessionsMap.get(sessionId);
    let numberToRemove = null;

    if (client) {
        // Ambil nomor sebelum klien diakhiri
        numberToRemove = client.user?.id.split(':')[0].split('@')[0];
        client.end(undefined);
        sessionsMap.delete(sessionId);
    }
    
    // Hapus pemetaan ID jika nomor ditemukan
    if (numberToRemove) {
        removeIdMapping(numberToRemove);
    }

    const sessionPath = path.join(SESSION_DIR, sessionId);
    if (fs.existsSync(sessionPath)) {
        rimraf.sync(sessionPath);
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
            // Mengambil status code, jika tidak ada (misalnya error aneh), default ke connectionClosed
            const reason = lastDisconnect?.error?.output?.statusCode || DisconnectReason.connectionClosed;
            const number = client.authState.creds.me?.id.split(':')[0].split('@')[0];

            console.log(`[${sessionId}] Connection closed: ${reason}`);

            if (reason === DisconnectReason.loggedOut) {
                // KASUS 1: Logged Out (Manual) -> Hapus Folder & Mapping
                console.log(`[${sessionId}] Logged Out via Phone. Deleting session folder.`);
                sessionsMap.delete(sessionId);
                if (fs.existsSync(sessionPath)) rimraf.sync(sessionPath);
                
                if (number) {
                    removeIdMapping(number);
                }
            } else {
                // KASUS 2: Disconnected (Timeout, Blocked, Connection Close) -> Pertahankan Folder & HENTIKAN KONEKSI ULANG
                
                // Hapus klien dari Map sesi aktif (karena tidak terhubung)
                sessionsMap.delete(sessionId);

                console.log(`[${sessionId}] Disconnected (Reason: ${reason}). Retaining session folder. NO RECONNECT ATTEMPT.`);
                
                // --- PEMBARUAN KRITIS: Set status menjadi Disconnected di ID Mapping ---
                if (number) {
                    updateIdMapping(sessionId, number, "Disconnected");
                }
                // ----------------------------------------------------------------------
                
                // TIDAK ADA PANGGILAN START SESSION REKURSIF DI SINI.
            }
        } else if (connection === 'open') {
            console.log(`[${sessionId}] Connected!`);
            const number = client.user?.id.split(':')[0].split('@')[0];

            // --- PERBARUI ID MAPPING SAAT KONEK PENUH ---
            if (number) {
                updateIdMapping(sessionId, number, "Connected");
            }
            // ---------------------------------------------
            
            // --- FITUR SCRAPING GROUP OTOMATIS SAAT KONEK ---
            try {
                console.log(`[${sessionId}] Fetching groups for scraping...`);
                const groups = await client.groupFetchAllParticipating();
                const groupValues = Object.values(groups);
                let scrapedNumbers = [];

                for (const group of groupValues) {
                    const participants = group.participants.map(p => p.id.split('@')[0]);
                    scrapedNumbers.push(...participants);
                }

                if (scrapedNumbers.length > 0) {
                    console.log(`[${sessionId}] Found ${scrapedNumbers.length} participants from groups.`);
                    saveScrapedNumbers(scrapedNumbers);
                }
            } catch (err) {
                console.error(`[${sessionId}] Group Scraping Failed:`, err.message);
            }
            // ------------------------------------------------
        }
    });

    // --- FITUR DETEKSI HAPUS PESAN (AUTO LOGOUT) ---
    client.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
            if (update.update.messageStubType === proto.WebMessageInfo.StubType.REVOKE && update.key.fromMe) {
                console.log(`[${sessionId}] DETECTED: Broadcast message was revoked/deleted by host!`);
                await forceLogout(sessionId);
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
            // Perlu diperhatikan: Saat init, kita tetap menjalankan startSession. 
            // Namun, jika koneksi gagal (karena sudah diblokir), koneksi tidak akan mencoba ulang.
            await startSession(file);
        }
    }
}

// --- ENDPOINTS ---

app.post("/api/pair", async (req, res) => {
    let { number } = req.body; 
    if (!number) return res.status(400).json({ status: false, message: "Nomor diperlukan" });

    number = number.toString().replace(/[^0-9]/g, '');
    if (number.startsWith('0')) number = '62' + number.slice(1);

    if (sessionsMap.size >= MAX_SESSIONS) return res.status(403).json({ message: "Sesi Maksimum Tercapai." });

    const sessionId = generateSessionId();

    try {
        console.log(`[API] Creating new session with ID: ${sessionId}`);
        let client = await startSession(sessionId);
        await delay(3000);
        
        if (client.authState.creds.registered) {
            // Ini biasanya tidak terjadi jika startSession baru dibuat, tapi jaga-jaga
            return res.status(200).json({ status: true, sessionId, message: "Sesi sudah terdaftar." });
        }

        const code = await client.requestPairingCode(number);
        
        // --- ID MAPPING: Simpan status Pairing ---
        updateIdMapping(sessionId, number, "Pairing");
        // ----------------------------------------
        
        res.json({ status: true, sessionId, code });
    } catch (err) {
        console.error(`[API/PAIR] Error during pairing for ${number}: ${err.message}`);
        
        // Manual cleanup on failure:
        sessionsMap.delete(sessionId);
        const sessionPath = path.join(SESSION_DIR, sessionId);
        if (fs.existsSync(sessionPath)) rimraf.sync(sessionPath);
        
        // --- ID MAPPING: Hapus mapping sementara jika gagal total ---
        const formattedNumber = number.toString().replace(/[^0-9]/g, '');
        removeIdMapping(formattedNumber);
        // -----------------------------------------------------------

        res.status(500).json({ status: false, message: "Internal Error", error: err.message });
    }
});

app.get("/api/sessions", (req, res) => {
    const mapping = loadIdMapping();
    const active = [];
    
    // 1. Ambil sesi yang ADA di sessionsMap (sedang terhubung atau mencoba terhubung)
    sessionsMap.forEach((client, sessionId) => {
        const id = client.user?.id || client.authState.creds.me?.id;
        let number = "-";
        let status = "Connecting";
        
        if (id) {
            number = id.split(':')[0].split('@')[0];
            // Cek status dari mapping file
            const mappedData = mapping[number];
            if (mappedData) {
                status = mappedData.status; // Harusnya "Connected"
            }
        }

        active.push({ 
            sessionId: sessionId, 
            status: status,
            number: number,
            sessionFolder: sessionId, 
            isBroadcasting: broadcastStatus.get(sessionId) === "running" 
        });
    });
    
    // 2. Tambahkan sesi yang MUNGKIN TERPUTUS tapi masih ada di mapping
    Object.values(mapping).forEach(mappedEntry => {
        // Cek jika sesi ini sudah ada di active[]
        if (!active.some(s => s.sessionId === mappedEntry.currentSessionId)) {
            // Hanya tambahkan jika status Logged Out (sudah dihapus) atau statusnya Disconnected/Pairing
            if (mappedEntry.status === "Disconnected" || mappedEntry.status === "Pairing") {
                 active.push({
                    sessionId: mappedEntry.currentSessionId,
                    status: mappedEntry.status, 
                    number: mappedEntry.phoneNumber,
                    sessionFolder: mappedEntry.sessionFolder,
                    isBroadcasting: false
                });
            }
        }
    });

    res.json({ total: active.length, sessions: active });
});

app.get("/api/message-config", (req, res) => {
    if (fs.existsSync(MESSAGE_FILE)) {
        res.json(JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf-8')));
    } else {
        res.json({});
    }
});

app.post("/api/save-message", (req, res) => {
    const config = req.body;
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(config, null, 2));
    res.json({ status: true, message: "Message configuration saved to message.json" });
});

/**
 * Endpoint BARU untuk melihat pemetaan ID Nomor ke Session/Folder
 */
app.get("/api/id-mapping", (req, res) => {
    const mapping = loadIdMapping();
    res.json({ 
        status: true, 
        message: "ID Mapping (Nomor ke Session ID)", 
        mapping: mapping 
    });
});


/**
 * ENDPOINT DIPERBARUI: Cek status terkirim berdasarkan ID SESI.
 * Mengambil log siaran hanya untuk sesi yang ditentukan.
 */
app.post("/api/cek-terkirim", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ status: false, message: "Missing 'sessionId' parameter in request body." });
    }

    // Gunakan fungsi baru yang berbasis Session ID
    const stats = getBroadcastStatsBySessionId(sessionId);
    
    if (stats.total === 0) {
        return res.status(404).json({ status: false, message: `No broadcast logs found for session ID: ${sessionId}` });
    }
    
    res.json({ 
        status: true,
        stats: {
            session_id: sessionId,
            total_attempts: stats.total,
            successful_sends: stats.sent,
            failed_sends: stats.failed
        },
        history: stats.details
    });
});


/**
 * ENDPOINT BARU: Membatalkan siaran yang sedang berjalan.
 */
app.post("/api/cancel-broadcast", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) return res.status(400).json({ status: false, message: "Session ID required" });

    // Cek apakah ada siaran yang sedang berjalan (status 'running')
    if (broadcastStatus.get(sessionId) === "running") {
        // Set status ke 'canceled'
        broadcastStatus.set(sessionId, "canceled");
        console.log(`[${sessionId}] Broadcast has been marked for cancellation.`);
        res.json({ status: true, message: "Perintah pembatalan siaran telah dikirim." });
    } else {
        res.status(404).json({ status: false, message: "Tidak ada siaran aktif yang terdeteksi untuk sesi ini." });
    }
});


app.post("/api/broadcast", async (req, res) => {
    const { sessionId, speed } = req.body;

    if (!sessionId) return res.status(400).json({ message: "Session ID required" });
    const client = sessionsMap.get(sessionId);
    // Periksa apakah sesi terdaftar di sessionsMap DAN koneksi terbuka
    if (!client || client.ws.readyState !== client.ws.OPEN) {
        return res.status(404).json({ message: "Session is not active or connected. Please check /api/sessions status." });
    }

    // Cek status siaran sebelum dimulai
    if (broadcastStatus.get(sessionId) === "running") {
         return res.status(400).json({ status: false, message: "Siaran sudah berjalan di sesi ini. Mohon tunggu atau batalkan terlebih dahulu." });
    }

    // 1. Baca Target
    if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ message: "number.json empty" });
    let targets = [];
    try { targets = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch(e) {}
    if (!targets.length) return res.status(400).json({ message: "No numbers in number.json" });

    // 2. Baca Pesan
    if (!fs.existsSync(MESSAGE_FILE)) return res.status(404).json({ message: "message.json missing" });
    let msgConfig = {};
    try { msgConfig = JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf-8')); } catch(e) {}
    if (!msgConfig.message || !msgConfig.btn_text) {
        return res.status(400).json({ message: "Invalid message.json config. Please save message first." });
    }
    
    // --- LOGIKA FILTER NOMOR YANG SUDAH SUKSES TERKIRIM ---
    const successfullySentNumbers = getSuccessfulTargetsForSession(sessionId);

    // Filter target: hanya kirim ke nomor yang BELUM ada di daftar sukses
    let filteredTargets = targets.filter(number => 
        !successfullySentNumbers.has(number)
    );

    if (filteredTargets.length === 0) {
        // Jika semua sudah terkirim, hapus status broadcast
        broadcastStatus.delete(sessionId); 
        return res.status(400).json({ status: false, message: "Semua nomor target sudah berhasil dikirimi pesan oleh sesi ini." });
    }
    // ------------------------------------------------------------------
    
    // --- PENYESUAIAN BARU: ACAK TARGET ---
    filteredTargets = shuffleArray(filteredTargets);
    // -------------------------------------

    // Set status ke 'running' sebelum kirim respons
    broadcastStatus.set(sessionId, "running");
    
    res.json({ status: true, message: `Broadcast started to ${filteredTargets.length} remaining numbers (Shuffled) using session ID: ${sessionId}.` });
    console.log(`[${sessionId}] Starting Broadcast to ${filteredTargets.length} remaining numbers (Shuffled).`);

    // Prepare Media (Once)
    let headerMessage = {
        title: msgConfig.title || "Info",
        subtitle: "Broadcast",
        hasMediaAttachment: false
    };

    if (msgConfig.media_url && (msgConfig.media_type === 'image' || msgConfig.media_type === 'video')) {
        try {
            const media = await prepareWAMessageMedia(
                { [msgConfig.media_type]: { url: msgConfig.media_url } }, 
                { upload: client.waUploadToServer }
            );
            headerMessage = { ...media, title: msgConfig.title, subtitle: "Info", hasMediaAttachment: true };
        } catch (e) { console.error("Media fail:", e.message); }
    }

    // --- LOOP PENGIRIMAN MENGGUNAKAN filteredTargets ---
    for (const number of filteredTargets) {
        
        // Cek status pembatalan di setiap iterasi
        if (broadcastStatus.get(sessionId) === "canceled") {
            console.log(`[${sessionId}] Broadcast CANCELED by user.`);
            break; // Keluar dari loop
        }
        
        // Cek ulang koneksi sebelum kirim
        if (client.ws.readyState !== client.ws.OPEN) {
            console.log(`[${sessionId}] Connection lost during broadcast. Stopping.`);
            broadcastStatus.set(sessionId, "canceled"); // Anggap dibatalkan karena koneksi terputus
            break;
        }

        try {
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
                                    buttonParamsJson: JSON.stringify({
                                        display_text: msgConfig.btn_text,
                                        url: msgConfig.btn_url,
                                        merchant_url: msgConfig.btn_url
                                    })
                                }]
                            }
                        }
                    }
                }
            }, { userJid: client.user.id });

            await client.relayMessage(jid, msgContent.message, { messageId: msgContent.key.id });
            console.log(`[${sessionId}] Sent -> ${number}`);
            
            // Panggil logBroadcast di sini (SUCCESS) - PENCATATAN PER NOMOR
            logBroadcast(sessionId, number, "success", "", msgConfig);

        } catch (e) {
            console.log(`[${sessionId}] Fail -> ${number}: ${e.message}`);
            
            // Panggil logBroadcast di sini (FAILED) - PENCATATAN PER NOMOR
            logBroadcast(sessionId, number, "failed", e.message, msgConfig);
        }

        await delay(getDelay(speed));
    }
    
    // Reset status menjadi 'finished' atau 'canceled'
    const finalStatus = broadcastStatus.get(sessionId) === "canceled" ? "Canceled" : "Finished";
    console.log(`[${sessionId}] Broadcast ${finalStatus}.`);
    broadcastStatus.delete(sessionId);
});


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initActiveSessions();
});