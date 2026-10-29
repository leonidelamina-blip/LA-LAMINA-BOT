const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser, normalizeMessageContent } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { ler, moldura } = require('./lib/util');

process.on('unhandledRejection', e => console.log('⚠️ unhandledRejection:', e?.message || e));
process.on('uncaughtException', e => console.log('⚠️ uncaughtException:', e?.message || e));

express().get('/', (_, r) => r.send('👁️ L LÂMINA SOMBRIO V20 online')).listen(3000, () => console.log('🌑 Servidor na porta 3000'));

const plugins = new Map();
const lista = [];
if (!global.contadorGratis) global.contadorGratis = new Map();

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

const LIVRES = ['gratis', 'menu', 'pagamento', 'tabela', 'canal', 'ping', 'bemvindo', 'donor', 'banir', 'criador', 'bot', 'time', 'info', 'dono', 'versao', 'id', 'uptime', 'horario'];
const COMANDOS_ALUGUEL = ['alugar', 'desalugar', 'alugados', 'addaluguel', 'aluguel'];

const EMOJI_CMD = {
  menu: '🩸', ping: '🤖', dono: '👁️', bot: '🦾', info: '📌', versao: '💿', uptime: '⏰', id: '🆔', horario: '⏰', clima: '🌦️', calc: '🧮', moedas: '💱', tradutor: '🌐', cep: '📍', ip: '🌐', ban: '☠️', kick: '👺', add: '➕', promover: '🏹', rebaixar: '📉', link: '🔗', revogar: '🔄', abrir: '🔓', fechar: '🔒', destrava: '💥', marcar: '🎯', hidetag: '👻', todos: '📢', tagall: '📢', invocar: '✨', infogp: '👥', fotogp: '🖼️', admin: '👑', mute: '🔇', unmute: '🔊', antilink: '🚫', pagamento: '💰', gratis: '🆓', canal: '📢', bemvindo: '👋', donor: '💎', criador: '👑', time: '⏰'
};

function emojiDoCmd(cmd) { return EMOJI_CMD[cmd] || '🩸'; }

const cacheMeta = new Map();
const meta = async (sock, jid) => {
  const k = cacheMeta.get(jid);
  if (k && Date.now() - k.t < 60000) return k.m;
  try {
    const m = await sock.groupMetadata(jid);
    cacheMeta.set(jid, { m, t: Date.now() });
    return m;
  } catch { return null; }
};

function pagamentoMsg() {
  return `╭─❋!°❋🩸 PAGAMENTO 🩸
│
│ ✦°♡🩸 Dono: Leonide António Lâmina
│ ✦°♡🩸 Número: 852223969
│
│ ✦°♡🩸 M-Pesa: 852223969
│    Nome: Leonide António Lâmina
│
│ ✦°♡🩸 e-Mola: Não disponível ❌
│
│ ✦°♡🩸 Envie o comprovativo
│    para wa.me/258852223969
│
│ ✦°♡🩸 Canal Oficial:
│ https://whatsapp.com/channel/0029VbBfoWhAO7RJaD9mXy2k
╰─❋!°❋🩸 Não falo muito. Executo. 🩸`;
}

function menu(c) {
  const texto = `╭─❋!°❋🩸 L LAMINA SOMBRIO V20
│❋!°❋🩸 Dono: Leonide 852223969
│❋!°❋🩸 Bot: Sasuke 872698781
│❋!°❋🩸 Prefixo: .
│❋!°❋🩸 200 Comandos Reais
╰─❋!°❋🩸 Frio. Direto. Sombrio.

Digite .pagamento para liberar
Canal: https://whatsapp.com/channel/0029VbBfoWhAO7RJaD9mXy2k`;
  return c.sock.sendMessage(c.jid, { text: texto }, { quoted: c.msg });
}

async function tratar(sock, msg) {
  if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
  if (!sock.user) return;
  const cfg = ler('config.json', {});
  const jid = msg.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const bot = jidNormalizedUser(sock.user.id);
  const sender = msg.key.fromMe ? bot : jidNormalizedUser(isGroup ? (msg.key.participant || msg.participant || '') : jid);
  const m = normalizeMessageContent(msg.message) || {};
  const tipo = Object.keys(m).find(k => k !== 'messageContextInfo');
  const texto = m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '';
  const ctxInfo = m[tipo]?.contextInfo || {};
  const num = x => String(x || '').split('@')[0].split(':')[0];
  const alt = msg.key.participantAlt || msg.key.remoteJidAlt || '';
  const isDono = !!msg.key.fromMe || (cfg.donos || []).some(d => String(d) === num(sender) || String(d) === num(alt));

  let metaG = null;
  if (isGroup) metaG = await meta(sock, jid);

  const alvos = [...(ctxInfo.mentionedJid || []), ...(ctxInfo.participant ? [ctxInfo.participant] : [])];
  const c = {
    sock, msg, m, tipo, ctxInfo, jid, isGroup, sender, bot, isDono, cfg, alvos, plugins, lista, num,
    recarregar: carregar,
    r: (l, ex = {}) => {
      const { titulo, ...resto } = ex;
      const emo = emojiDoCmd(c.cmd || 'menu');
      const linhas = Array.isArray(l) ? l : [l];
      const comEmoji = linhas.map((x, i) => i === 0 ? `${emo} ${x}` : x);
      return sock.sendMessage(jid, { text: moldura(comEmoji, titulo), ...resto }, { quoted: msg });
    }
  };

  for (const p of lista) {
    if (typeof p.onMessage === 'function') { try { await p.onMessage(c); } catch {} }
  }

  const pre = cfg.prefixo || '.';
  if (!texto.startsWith(pre)) return;
  const [cmd, ...args] = texto.slice(pre.length).trim().split(/\s+/);
  c.cmd = (cmd || '').toLowerCase();
  c.args = args;
  c.q = args.join(' ');
  if (!c.cmd) return;

  const p = plugins.get(c.cmd);
  if (!p && !['menu', 'pagamento'].includes(c.cmd)) return;

  try {
    const emojiReacao = emojiDoCmd(c.cmd);
    await sock.sendMessage(jid, { react: { text: emojiReacao, key: msg.key } }).catch(() => {});

    if (c.cmd === 'menu') {
      await menu(c);
    } else if (c.cmd === 'pagamento') {
      await sock.sendMessage(jid, { text: pagamentoMsg() }, { quoted: msg });
    } else {
      if (typeof p.run !== 'function') throw new Error('Comando sem função run');
      await p.run(c);
    }

    if (!isDono) {
      const key = sender;
      const atual = (global.contadorGratis.get(key) || 0) + 1;
      global.contadorGratis.set(key, atual);
      if (atual % 7 === 0) {
        await sock.sendMessage(jid, {
          text: `╭─❋!°❋🩸 ANÚNCIO - MODO GRÁTIS 🩸\n│\n│ ✦°♡🩸 Você usou ${atual} comandos\n│ ✦°♡🩸 No grátis tem anúncio a cada 7\n│ ✦°♡🩸 Remova com .pagamento\n│\n│ ✦°♡🩸 M-Pesa: 852223969\n│ ✦°♡🩸 Nome: Leonide António Lâmina\n│ ✦°♡🩸 e-Mola: Não disponível ❌\n│ ✦°♡🩸 Envie comprovativo no PV\n│ wa.me/258852223969\n│\n│ ✦°♡🩸 Canal: https://whatsapp.com/channel/0029VbBfoWhAO7RJaD9mXy2k\n╰─❋!°❋🩸`
        }, { quoted: msg }).catch(()=>{});
      }
    }

  } catch (e) {
    console.log('❌', c.cmd, e.message);
    c.r([`${emojiDoCmd(c.cmd)} O Sharingan falhou...`, e.message]).catch(() => {});
  }
}

let sockAtual = null;
let reconectando = false;
function agendarReconexao() {
  if (reconectando) return;
  reconectando = true;
  setTimeout(() => {
    reconectando = false;
    conectar().catch(e => { console.log('Erro ao reconectar:', e.message); agendarReconexao(); });
  }, 3000);
}

async function conectar() {
  if (sockAtual) { try { sockAtual.ev.removeAllListeners(); } catch {} try { sockAtual.end(undefined); } catch {} sockAtual = null; }
  if (!fs.existsSync('./auth')) fs.mkdirSync('./auth', { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const { version } = await fetchLatestBaileysVersion();
  const cfg = ler('config.json', {});
  const numeroBotFinal = String(cfg.numeroBot || '258872698781').replace(/\D/g, '');
  const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ['Ubuntu', 'Chrome', '20.0.04'] });
  sockAtual = sock;
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        if (sock.authState.creds.registered) return;
        const code = await sock.requestPairingCode(numeroBotFinal);
        console.log(`\n==========================\nSEU CODIGO: ${code}\n==========================\n`);
      } catch (e) { console.log('Erro pairing:', e.message); }
    }, 3000);
  }
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !numeroBotFinal) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log(`🩸 Uchiha online - Bot ${numeroBotFinal}`);
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) console.log('Sessão encerrada: apague a pasta auth');
      else { console.log(`Conexão fechada (${code ?? 'sem código'}). Reconectando...`); agendarReconexao(); }
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) { try { await tratar(sock, msg); } catch (e) { console.log('erro:', e.message); } }
  });
}

carregar();
conectar().catch(e => { console.log('Erro ao iniciar:', e.message); agendarReconexao(); });