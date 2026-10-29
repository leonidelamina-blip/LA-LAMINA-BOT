const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser, normalizeMessageContent } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { ler, moldura } = require('./lib/util');

process.on('unhandledRejection', e => console.log('⚠️ unhandled:', e?.message));
process.on('uncaughtException', e => console.log('⚠️ uncaught:', e?.message));

// === SERVIDOR COM KEEP-ALIVE PRO UPTIME ROBOT ===
const app = express();
app.get('/', (_, r) => r.send('👁️ L LÂMINA SOMBRIO V20 online - Dono Leonide 852223969'));
app.get('/ping', (_, r) => r.send(`pong ${new Date().toISOString()} - M-Pesa 852223969`));
app.get('/status', (_, r) => r.json({ status: 'online', dono: 'Leonide António Lâmina', numero: '852223969', mpesa: '852223969', emola: 'Não disponível', uptime: process.uptime() }));
app.listen(3000, () => console.log('🌑 Servidor na porta 3000 - UptimeRobot pode pingar /ping'));

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
        cmds.forEach(c => { if (typeof c === 'string') plugins.set(c.toLowerCase(), m); });
      }
    } catch (e) { console.log(`Erro ${f}: ${e.message}`); }
  }
  console.log(`🩸 ${lista.length} plugins carregados`);
}

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
  return c.sock.sendMessage(c.jid, { text: `╭─❋!°❋🩸 L LAMINA SOMBRIO V20\n│ Dono: Leonide 852223969\n│ Bot: Sasuke 872698781\n│ Prefixo: .\n│ 200 Comandos\n╰─❋!°❋🩸\n\nDigite .pagamento para liberar\nCanal: https://whatsapp.com/channel/0029VbBfoWhAO7RJaD9mXy2k` }, { quoted: c.msg });
}

const EMOJI_CMD = { menu:'🩸', ping:'🤖', dono:'👁️', rank:'🏆', bv:'👋', beleza:'💅', antilink:'🚫', pagamento:'💰', gratis:'🆓' };
function emojiDoCmd(cmd) { return EMOJI_CMD[cmd] || '🩸'; }

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
  const num = x => String(x || '').split('@')[0].split(':')[0];
  const isDono = !!msg.key.fromMe || (cfg.donos || []).some(d => String(d) === num(sender));

  const c = {
    sock, msg, m, tipo, jid, isGroup, sender, bot, isDono, cfg, plugins, lista, num,
    recarregar: carregar,
    r: (l, ex = {}) => {
      const { titulo, ...resto } = ex;
      const emo = emojiDoCmd(c.cmd || 'menu');
      const linhas = Array.isArray(l) ? l : [l];
      const comEmoji = linhas.map((x, i) => i === 0 ? `${emo} ${x}` : x);
      return sock.sendMessage(jid, { text: moldura(comEmoji, titulo), ...resto }, { quoted: msg });
    }
  };

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
    await sock.sendMessage(jid, { react: { text: emojiDoCmd(c.cmd), key: msg.key } }).catch(() => {});
    if (c.cmd === 'menu') await menu(c);
    else if (c.cmd === 'pagamento') await sock.sendMessage(jid, { text: pagamentoMsg() }, { quoted: msg });
    else if (typeof p.run === 'function') await p.run(c);

    if (!isDono) {
      const key = sender;
      const atual = (global.contadorGratis.get(key) || 0) + 1;
      global.contadorGratis.set(key, atual);
      if (atual % 7 === 0) {
        await sock.sendMessage(jid, {
          text: `╭─❋!°❋🩸 ANÚNCIO - MODO GRÁTIS 🩸\n│ Você usou ${atual} comandos\n│ Remova com .pagamento\n│ M-Pesa: 852223969\n│ Nome: Leonide António Lâmina\n│ e-Mola: Não disponível ❌\n│ wa.me/258852223969\n╰─❋!°❋🩸`
        }, { quoted: msg }).catch(()=>{});
      }
    }
  } catch (e) { console.log('❌', c.cmd, e.message); }
}

let sockAtual = null;
let reconectando = false;
function agendarReconexao() {
  if (reconectando) return;
  reconectando = true;
  console.log('🔄 Tentando reconectar em 5s...');
  setTimeout(() => { reconectando = false; conectar().catch(()=>agendarReconexao()); }, 5000);
}

async function conectar() {
  if (sockAtual) { try { sockAtual.ev.removeAllListeners(); } catch {} try { sockAtual.end(undefined); } catch {} sockAtual = null; }
  if (!fs.existsS
conectar().catch(e => { console.log('Erro ao iniciar:', e.message); agendarReconexao(); });
