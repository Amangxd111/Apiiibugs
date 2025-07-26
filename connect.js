exports.konek = async ({ client, update, clientstart, DisconnectReason, Boom }) => {
  const { connection, lastDisconnect } = update;

  if (connection === 'close') {
    const error = lastDisconnect?.error;
    const reason = new Boom(error)?.output?.statusCode;
    const rawMessage = error?.message || 'Tidak ada pesan error';
    const fullStack = error?.stack || 'Tidak ada stack trace';

    console.log(`❌ Koneksi ditutup!`);
    console.log(`↪️ Status code: ${reason}`);
    console.log(`↪️ Pesan error: ${rawMessage}`);
    console.log(`↪️ Stack trace:`, fullStack);

    switch (reason) {
      case DisconnectReason.badSession:
        console.log(`❌ Bad session file. Hapus session dan scan ulang.`);
        process.exit(1);
        break;

      case DisconnectReason.connectionClosed:
      case DisconnectReason.connectionLost:
      case DisconnectReason.timedOut:
      case DisconnectReason.restartRequired:
        console.log(`🔄 Koneksi terputus (${reason}), mencoba ulang...`);
        clientstart();
        break;

      case DisconnectReason.connectionReplaced:
        console.log(`⚠️ Session digantikan, keluar...`);
        process.exit(1);
        break;

      case DisconnectReason.loggedOut:
        console.log(`🚫 Akun logout! Scan ulang WA.`);
        process.exit(1);
        break;

      default:
        console.log(`❓ Alasan disconnect tidak dikenal (${reason}), restart total...`);
        clientstart();
    }

  } else if (connection === "open") {
    console.log("✅ Koneksi berhasil, menunggu 3 detik agar stabil...");

    setTimeout(() => {
      try {
        const nomor = client.user.id.split(':')[0];
        console.log(`
===================================================
✅ Bot berhasil terhubung ke WhatsApp!
🔗 Nomor: ${nomor}
===================================================
Owner: @AmangXd1
===================================================
        `);
      } catch (e) {
        console.log("✅ Bot berhasil konek, tapi gagal ambil nomor.");
      }
    }, 3000);
  }
};