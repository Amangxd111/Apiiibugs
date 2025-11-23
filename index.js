console.clear();
console.log('Starting Multi-Session Server...');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    delay,
    Browsers
} = require("@whiskeysockets/baileys");

const pino = require('pino');
const fs = require('fs');
const express = require("express");
const cors = require("cors");
const path = require("path");
const rimraf = require("rimraf"); // Pastikan install ini: npm install rimraf

const app = express();
const PORT = process.env.PORT || 5036;

// --- CONFIGURATION ---
const MAX_SESSIONS = 10;
const SESSION_DIR = path.join(__dirname, 'sessions');

// --- GLOBAL SESSION STORAGE ---
// Key: username, Value: socket instance
const sessionsMap = new Map();

// Middleware
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ensure session root directory exists
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// --- CORE FUNCTION: START SPECIFIC SESSION ---
async function startSession(username) {
    const sessionPath = path.join(SESSION_DIR, username);
    
    // Setup Auth
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu("Chrome"),
        markOnlineOnConnect: true
    });

    // Simpan client ke Map global agar bisa diakses via API
    sessionsMap.set(username, client);

    // Handle Credentials Update
    client.ev.on('creds.update', saveCreds);

    // Handle Connection Update
    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
  
    }

  } else if (connection === "open") {
            console.log(`[${username}] Connected Successfully!`);
        }
    });

    // Handle Messages (Contoh log sederhana)
    client.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            // Di sini logika bot per session
            // console.log(`[${username}] New Message from ${mek.key.remoteJid}`);
        } catch (err) {
            console.log(err);
        }
    });

    return client;
}

// --- RESTORE SESSIONS ON STARTUP ---
// Fungsi ini membaca folder 'sessions' saat restart dan menghidupkan kembali semua bot
async function initActiveSessions() {
    const files = fs.readdirSync(SESSION_DIR);
    console.log(`Found ${files.length} saved sessions.`);
    
    for (const file of files) {
        // Cek apakah itu folder session valid (bukan file sampah)
        const fullPath = path.join(SESSION_DIR, file);
        if (fs.statSync(fullPath).isDirectory()) {
            console.log(`Restoring session: ${file}`);
            await startSession(file);
        }
    }
}

// --- API ENDPOINTS ---

// 1. Endpoint Pairing (Membuat Session Baru / Connect Ulang)
app.post("/api/pair", async (req, res) => {
    const { username, number } = req.body;

    if (!username || !number) {
        return res.status(400).json({ status: false, message: "Username dan Nomor WhatsApp diperlukan!" });
    }

    // Cek Limit Session
    if (!sessionsMap.has(username) && sessionsMap.size >= MAX_SESSIONS) {
        return res.status(403).json({ status: false, message: "Maksimal sesi tercapai (10 Sesi)." });
    }

    try {
        // Jika sesi belum ada di map, inisialisasi baru
        let client = sessionsMap.get(username);
        if (!client) {
            console.log(`[API] Creating new session for ${username}`);
            client = await startSession(username);
            // Delay sebentar untuk memastikan socket siap
            await delay(2000);
        }

        // Cek apakah sudah terdaftar
        if (client.authState.creds.registered) {
            return res.status(200).json({ status: true, message: "Session ini sudah terhubung ke WhatsApp." });
        }

        // Request Pairing Code
        const code = await client.requestPairingCode(number);
        console.log(`[${username}] Pairing Code: ${code}`);
        
        res.json({ 
            status: true, 
            username: username,
            code: code 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: "Internal Server Error", error: err.message });
    }
});

// 2. Endpoint Kirim Pesan (Spesifik per Username)
app.post("/api/send-message", async (req, res) => {
    const { username, target, message } = req.body;

    if (!username || !target || !message) {
        return res.status(400).json({ status: false, message: "Parameter tidak lengkap (username, target, message)" });
    }

    const client = sessionsMap.get(username);

    if (!client) {
        return res.status(404).json({ status: false, message: `Session dengan username '${username}' tidak ditemukan atau belum aktif.` });
    }

    try {
        // Format nomor (hapus 0 ganti 62, atau tambahkan @s.whatsapp.net)
        let jid = target.includes('@s.whatsapp.net') ? target : `${target}@s.whatsapp.net`;

        await client.sendMessage(jid, { text: message });
        
        res.json({ status: true, message: `Pesan terkirim via session ${username}` });
    } catch (err) {
        res.status(500).json({ status: false, message: "Gagal mengirim pesan", error: err.message });
    }
});

// 3. Endpoint Cek List Session Aktif
app.get("/api/sessions", (req, res) => {
    const activeSessions = [];
    sessionsMap.forEach((client, username) => {
        activeSessions.push({
            username: username,
            status: client.authState.creds.registered ? "Connected" : "Pairing/Disconnected"
        });
    });
    
    res.json({
        total: activeSessions.length,
        max: MAX_SESSIONS,
        sessions: activeSessions
    });
});

// 4. Endpoint Delete Session
app.post("/api/delete-session", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({message: "Username required"});

    const client = sessionsMap.get(username);
    if (client) {
        client.end(undefined); // Tutup socket
        sessionsMap.delete(username); // Hapus dari map
    }

    const sessionPath = path.join(SESSION_DIR, username);
    if (fs.existsSync(sessionPath)) {
        rimraf.sync(sessionPath); // Hapus folder fisik
        return res.json({ status: true, message: `Session ${username} berhasil dihapus.` });
    } else {
        return res.json({ status: false, message: `Folder session ${username} tidak ditemukan.` });
    }
});

// Start Server & Init Sessions
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initActiveSessions(); // Restore sesi yang tersimpan saat server nyala
});

