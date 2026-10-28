const numeroBot = '258872698781'; // SEU NÚMERO DO BOT

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ['L LAMINA V20', 'Chrome', '110.0']
  });

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(numeroBot);
        console.log(`\n==========================`);
        console.log(` SEU CÓDIGO É: ${code}`);
        console.log(` COLOCA NO WHATSAPP AGORA`);
        console.log(`==========================\n`);
      } catch (e) {
        console.log('Erro código:', e.message);
      }
    }, 5000);
  }

  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) iniciar();
    } else if (connection === 'open') {
      console.log('🩸 L LÂMINA CONECTADO! 258872698781');
    }
  });

  // chama seu tratador de mensagens aqui - mantém seu código de antes de tratar msg
}

iniciar();
