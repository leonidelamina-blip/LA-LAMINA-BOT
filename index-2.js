const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  normalizeMessageContent
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { ler, moldura } = require('./lib/util');

// ===== Evita que o bot caia por erros inesperados =====
process.on('unhandledRejection', e => console.log('⚠️ unhandledRejection:', e?.message || e));
process.on('uncaughtException', e => console.log('⚠️ uncaughtException:', e?.message || e));

// ===== Servidor web (mantém o bot vivo em hospedagens) =====
express()
  .get('/', (_, r) => r.send('👁️ L LÂMINA SOMBRIO V20 online'))
  .listen(3000, () => console.log('🌑 Servidor na porta 3000'));

// ===== Plugins =====
const plugins = new Map();
const lista = [];

function carregar() {
  plugins.clear();
  lista.length = 0;
  const pasta = path.join(__dirname, 'plugins');
  if (!fs.existsSync(pasta)) return;
  for (const f of fs.readdirSync(pasta).filter(x => x.endsWith('.js'))) {
    try {
      const p = path.join(pasta, f);
      delete require.cache[require.resolve(p)];
      const m = require(p);
      if (!m) continue;
      lista.push(m);
      if (m.cmd) {
        const cmds = Array.isArray(m.cmd) ? m.cmd : [m.cmd];
        cmds.forEach(c => {
          if (typeof c === 'string') plugins.set(c.toLowerCase(), m);
        });
      }
    } catch (e) {
      console.log(`Erro ${f}: ${e.message}`);
    }
  }
  console.log(`🩸 ${lista.length} plugins carregados`);
}

const ORDEM = ['ADM', 'VENDAS', 'DOWNLOAD', 'FIGURINHAS', 'ANIME', 'GRUPO', 'IA', 'JOGOS', '+18', 'DIVERSAO', 'UTILIDADES', 'DONO'];
const LIVRES = ['gratis', 'menu', 'pagamento', 'tabela', 'canal', 'ping'];

// ===== Cache de metadados de grupo =====
const cacheMeta = new Map();
const meta = async (sock, jid) => {
  const k = cacheMeta.get(jid);
  if (k && Date.now() - k.t < 60000) return k.m;
  try {
    const m = await sock.groupMetadata(jid);
    cacheMeta.set(jid, { m, t: Date.now() });
    return m;
  } catch {
    return null;
  }
};

const contarCmds = m => (Array.isArray(m.cmd) ? m.cmd.length : m.cmd ? 1 : 0);

// ===== Menu =====
function menu(c) {
  const cats = {};
  lista.forEach(m => {
    if (m.cat && m.cmd) (cats[m.cat] ||= []).push(...(Array.isArray(m.cmd) ? m.cmd : [m.cmd]));
  });
  const nome = ORDEM[parseInt(c.args[0]) - 1];
  const p = c.cfg.prefixo || '.';
  if (nome) {
    return c.r(
      [
        `🐍 ${nome} (${cats[nome]?.length || 0})`,
        ...(nome === '+18' ? ['⚠️ Só maiores de idade.'] : []),
        '',
        ...(cats[nome] || []).map(x => p + x)
      ],
      { titulo: 'L LAMINA SOMBRIO V20' }
    );
  }
  return c.r(
    [
      `Dono: ${c.cfg.donoNome || '852223969'}`,
      `Prefixo: ${p}`,
      `Total comandos: ${lista.reduce((s, m) => s + contarCmds(m), 0)}`,
      'Estilo: Sasuke Sombrio',
      '',
      '🐍 ANTI-GRUPO',
      '🩸 BOAS-VINDAS',
      '👁️ ALUGUEL',
      '',
      ...ORDEM.map((n, i) => `${i + 1}. ${n} (${cats[n]?.length || 0})`),
      '',
      `Use ${p}menu <número>`
    ],
    { titulo: 'L LAMINA SOMBRIO V20' }
  );
}

// ===== Tratamento de mensagens =====
async function tratar(sock, msg) {
  if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
  if (!sock.user) return;

  const cfg = ler('config.json', {});
  const jid = msg.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const bot = jidNormalizedUser(sock.user.id);
  const sender = msg.key.fromMe
    ? bot
    : jidNormalizedUser(isGroup ? (msg.key.participant || msg.participant || '') : jid);

  const m = normalizeMessageContent(msg.message) || {};
  const tipo = Object.keys(m).find(k => k !== 'messageContextInfo');
  const texto =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    '';
  const ctxInfo = m[tipo]?.contextInfo || {};
  const num = x => String(x || '').split('@')[0].split(':')[0];
  const alt = msg.key.participantAlt || msg.key.remoteJidAlt || '';
  const isDono =
    !!msg.key.fromMe ||
    (cfg.donos || []).some(d => String(d) === num(sender) || String(d) === num(alt));

  let metaG = null;
  let isAdm = false;
  let isBotAdm = false;
  if (isGroup) {
    metaG = await meta(sock, jid);
    const adm = id => !!metaG?.participants?.some(p => p.admin && num(p.id) === num(id));
    isAdm = adm(sender);
    isBotAdm = adm(bot);
  }

  const alvos = [...(ctxInfo.mentionedJid || []), ...(ctxInfo.participant ? [ctxInfo.participant] : [])];

  const c = {
    sock, msg, m, tipo, ctxInfo, jid, isGroup, sender, bot,
    isDono, isAdm, isBotAdm, meta: metaG, texto, cfg, alvos,
    plugins, lista, num, recarregar: carregar,
    r: (l, ex = {}) => {
      const { titulo, ...resto } = ex;
      return sock.sendMessage(jid, { text: moldura(l, titulo), ...resto }, { quoted: msg });
    }
  };

  // Hooks onMessage (suporta funções sync e async)
  for (const p of lista) {
    if (typeof p.onMessage === 'function') {
      try { await p.onMessage(c); } catch {}
    }
  }

  const pre = cfg.prefixo || '.';
  if (!texto.startsWith(pre)) return;

  const [cmd, ...args] = texto.slice(pre.length).trim().split(/\s+/);
  c.cmd = (cmd || '').toLowerCase();
  c.args = args;
  c.q = args.join(' ');
  if (!c.cmd) return;

  args.forEach(a => {
    if (/^\d{8,15}$/.test(a)) alvos.push(a + '@s.whatsapp.net');
  });

  const p = plugins.get(c.cmd);
  if (!p && c.cmd !== 'menu') return;
  if (cfg.ligado === false && !isDono) return;

  // Aluguel de grupos
  if (isGroup && c.cmd !== 'aluguel') {
    let aluguel = null;
    try { aluguel = require('./plugins/aluguel'); } catch {}
    if (aluguel) {
      let alugados = [];
      try { alugados = ler('alugados.json', []); } catch {}
      if (!alugados.includes(jid)) {
        const aviso = typeof aluguel.negado === 'function' ? aluguel.negado(cfg) : 'Grupo sem aluguel ativo.';
        return sock.sendMessage(jid, { text: aviso }, { quoted: msg });
      }
    }
  }

  // Privado: bloqueio sem teste grátis
  if (!isGroup && !isDono && cfg.bloquearPVsemGratis && !LIVRES.includes(c.cmd)) {
    let gratis = null;
    try { gratis = require('./plugins/gratis'); } catch {}
    if (gratis && typeof gratis.livre === 'function' && !gratis.livre(jid)) {
      return c.r(['Sem acesso, sem poder.', 'Digite .gratis para o teste de 1 dia.']);
    }
  }

  try {
    if (c.cmd === 'menu') {
      await menu(c);
    } else {
      if (typeof p.run !== 'function') throw new Error('Comando sem função run');
      await p.run(c);
    }
    for (const h of lista) {
      if (typeof h.aposComando === 'function') {
        try { await h.aposComando(c); } catch {}
      }
    }
  } catch (e) {
    console.log('❌', c.cmd, e.message);
    c.r(['O Sharingan falhou...', e.message]).catch(() => {});
  }
}

// ===== Conexão =====
let sockAtual = null;
let reconectando = false;

function agendarReconexao() {
  if (reconectando) return;
  reconectando = true;
  setTimeout(() => {
    reconectando = false;
    conectar().catch(e => {
      console.log('Erro ao reconectar:', e.message);
      agendarReconexao();
    });
  }, 3000);
}

async function conectar() {
  // Encerra socket antigo para não duplicar listeners/mensagens
  if (sockAtual) {
    try { sockAtual.ev.removeAllListeners(); } catch {}
    try { sockAtual.end(undefined); } catch {}
    sockAtual = null;
  }

  if (!fs.existsSync('./auth')) fs.mkdirSync('./auth', { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const { version } = await fetchLatestBaileysVersion();
  const cfg = ler('config.json', {});
  const numeroBotFinal = String(cfg.numeroBot || '258872698781').replace(/\D/g, '');

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  });
  sockAtual = sock;

  // Pairing code (só se ainda não estiver registrado)
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        if (sock.authState.creds.registered) return;
        const code = await sock.requestPairingCode(numeroBotFinal);
        console.log(`\n==========================\nSEU CODIGO: ${code}\n==========================\n`);
      } catch (e) {
        console.log('Erro pairing:', e.message);
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !numeroBotFinal) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log(`🩸 Uchiha online - Bot ${numeroBotFinal}`);
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('Sessão encerrada: apague a pasta auth e reinicie o bot');
      } else {
        console.log(`Conexão fechada (${code ?? 'sem código'}). Reconectando...`);
        agendarReconexao();
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try { await tratar(sock, msg); } catch (e) { console.log('erro:', e.message); }
    }
  });

  sock.ev.on('group-participants.update', u => {
    lista.forEach(p => {
      try { Promise.resolve(p.onParticipants?.(sock, u)).catch(() => {}); } catch {}
    });
  });

  sock.ev.on('groups.upsert', gs => {
    gs.forEach(g =>
      lista.forEach(p => {
        try { Promise.resolve(p.onGrupo?.(sock, g)).catch(() => {}); } catch {}
      })
    );
  });
}

// ===== Início =====
carregar(); // plugins carregados só uma vez
conectar().catch(e => {
  console.log('Erro ao iniciar:', e.message);
  agendarReconexao();
});
