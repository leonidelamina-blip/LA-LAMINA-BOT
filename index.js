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
function carregar() {
  plugins.clear(); lista.length = 0;
  const pasta = path.join(__dirname, 'plugins');
  if (!fs.existsSync(pasta)) return;
  for (const f of fs.readdirSync(pasta).filter(x => x.endsWith('.js'))) {
    try {
      const p = path.join(pasta, f);
      delete require.cache[require.resolve(p)];
      const m = require(p); if (!m) continue;
      lista.push(m);
      if (m.cmd) {
        const cmds = Array.isArray(m.cmd) ? m.cmd : [m.cmd];
        cmds.forEach(c => { if (typeof c === 'string') plugins.set(c.toLowerCase(), m); });
      }
    } catch (e) { console.log(`Erro ${f}: ${e.message}`); }
  }
  console.log(`🩸 ${lista.length} plugins carregados`);
}

const LIVRES = ['gratis', 'menu', 'pagamento', 'tabela', 'canal', 'ping'];
const COMANDOS_ALUGUEL = ['alugar', 'desalugar', 'alugados', 'addaluguel', 'aluguel'];

const EMOJI_CMD = {
  menu: '🩸', ping: '🤖', dono: '👁️', bot: '🦾', info: '📌', versao: '💿', uptime: '⏰',
  id: '🆔', horario: '⏰', clima: '🌦️', calc: '🧮', moedas: '💱', tradutor: '🌐', cep: '📍', ip: '🌐',
  ban: '☠️', kick: '👺', add: '➕', promover: '🏹', rebaixar: '📉', link: '🔗', revogar: '🔄',
  abrir: '🔓', fechar: '🔒', destrava: '💥', marcar: '🎯', hidetag: '👻', todos: '📢', tagall: '📢',
  invocar: '✨', infogp: '👥', fotogp: '🖼️', admin: '👑', mute: '🔇', unmute: '🔊',
  antilink: '🚫', antifoto: '📸', antisticker: '🏷️', antispam: '💥', antilink2: '🌐',
  antivideo: '🎬', antiaudio: '🎧', antifake: '🎭', play: '🎤', ytmp3: '🎵', ytmp4: '🎬',
  tiktok: '🎭', ig: '📸', insta: '📸', fb: '📘', apk: '💾', spotify: '🎧', pinterest: '📌',
  mediafire: '☁️', fig: '🖼️', sticker: '🏷️', toimg: '🔄', tomp3: '🎵', attp: '✨', ttp: '🔤',
  qc: '💬', emojimix: '😂', gpt: '🤖', ia: '🧠', gemini: '💎', dalle: '🎨', imagine: '💭',
  dado: '🎲', ppt: '✊', roleta: '🎰', cassino: '💰', velha: '♟️', forca: '🪢', slot: '🍒',
  blackjack: '🃏', quiz: '❓', uno: '🎨', akinator: '🧞', minerar: '⛏️', loja: '🏪', top: '🏆',
  sasuke: '🔥', itachi: '🩸', naruto: '🍥', sharingan: '👁️', chidori: '⚡', amaterasu: '🔥',
  susanoo: '⚔️', akatsuki: '☁️', compra: '🛒', venda: '💸', ranking: '📊', mpesa: '📱', emola: '💳',
  bass: '🔊', nightcore: '🌙', robot: '🤖', slow: '🐢', logo: '🎨', bemvindo: '👋', adeus: '👋',
  alugar: '💰', desalugar: '🔒', alugados: '📍', broadcast: '📢', desligar: '💤', ligar: '⚡', banir: '☠️'
};
function emojiDoCmd(cmd) { return EMOJI_CMD[cmd] || '🩸'; }

const cacheMeta = new Map();
const meta = async (sock, jid) => {
  const k = cacheMeta.get(jid);
  if (k && Date.now() - k.t < 60000) return k.m;
  try {
    const m = await sock.groupMetadata(jid);
    cacheMeta.set(jid, { m, t: Date.now() }); return m;
  } catch { return null; }
};

function menu(c) {
  const texto = `╭─❋!°❋🩸 L LAMINA SOMBRIO V20
│❋!°❋🩸 Dono: Leo 852223969
│❋!°❋🩸 Bot: Sasuke 872698781
│❋!°❋🩸 Prefixo: .
│❋!°❋🩸 200 Comandos Reais
│❋!°❋🩸 Tema: Sasuke Uchiha
╰─❋!°❋🩸 Frio. Direto. Sombrio.

╭─❋!°❋🩸 INFO (15)
│ .menu .ping .dono .bot .info
│ .versao .uptime .id .horario .clima
│ .calc .moedas .tradutor .cep .ip
╰────────────────

╭─❋!°❋🩸 GRUPO (25)
│ .ban .kick .add .promover .rebaixar
│ .link .revogar .abrir .fechar .destrava
│ .marcar .hidetag .todos .tagall .invocar
│ .infogp .fotogp .nomegp .descgp .admins
│ .mute .unmute .fantasma .ativos .lista
╰────────────────

╭─❋!°❋🩸 PROTECAO (15)
│ .antilink .antilink2 .antifoto .antivideo
│ .antiaudio .antisticker .antidoc .antifake
│ .antispam .antiflood .antiporn .antipv
│ .antipalavrao .modogp .filtro
╰────────────────

╭─❋!°❋🩸 DOWNLOADS (20)
│ .play .ytmp3 .ytmp4 .tiktok .tt .tiktok2
│ .ig .insta .fb .facebook .apk .apkmod
│ .spotify .soundcloud .pinterest .mediafire
│ .gdrive .mega .twitter .kwai
╰────────────────

╭─❋!°❋🩸 STICKER (15)
│ .fig .figu .sticker .s .toimg .tomp3
│ .tovideo .togif .attp .attp2 .ttp .ttp2
│ .qc .emojimix .take
╰────────────────

╭─❋!°❋🩸 IA (10)
│ .gpt .ia .gemini .gpt4 .bard
│ .dalle .imagine .iaimg .pergunta .simi
╰────────────────

╭─❋!°❋🩸 JOGOS (20)
│ .dado .ppt .jokenpo .roleta .cassino
│ .velha .forca .adivinha .slot .blackjack
│ .quiz .enigmas .xadrez .uno .akinator
│ .minerar .roubar .loja .inventario .top
╰────────────────

╭─❋!°❋🩸 ANIME - SASUKE (15)
│ .sasuke .itachi .naruto .sharingan .chidori
│ .amaterasu .susanoo .rasengan .akatsuki
│ .madara .obito .kakashi .sakura .hinata
╰────────────────

╭─❋!°❋🩸 VENDAS - MEGAS (10)
│ .compra .venda .ranking .top .mpesa
│ .emola .formapagamento .estoque .preco .cliente
╰────────────────

╭─❋!°❋🩸 AUDIO (10)
│ .bass .blown .deep .earrape .fast
│ .nightcore .reverse .robot .slow .tupai
╰────────────────

╭─❋!°❋🩸 LOGOS (10)
│ .logo .logoglow .logofire .logoneon
│ .logo3d .logomarvel .logogaming .logopubg
│ .logofreefire .logonaruto
╰────────────────

╭─❋!°❋🩸 BEM-VINDO (5)
│ .bemvindo .adeus .autosticker .autoreacao .autolevel
╰────────────────

╭─❋!°❋🩸 DONO - N3 (15)
│ .alugar .desalugar .alugados .addaluguel
│ .broadcast .bc .desligar .ligar .reiniciar
│ .banir .desbanir .donoadd .donorm .prefixo
╰────────────────

╭─❋!°❋🩸 TOTAL: 200 COMANDOS
╰─❋!°❋🩸 Não falo muito. Executo. 🩸`;
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
  let metaG = null; let isAdm = false; let isBotAdm = false;
  if (isGroup) {
    metaG = await meta(sock, jid);
    const adm = id => !!metaG?.participants?.some(p => p.admin && num(p.id) === num(id));
    isAdm = adm(sender); isBotAdm = adm(bot);
  }
  const alvos = [...(ctxInfo.mentionedJid || []), ...(ctxInfo.participant ? [ctxInfo.participant] : [])];
  const c = {
    sock, msg, m, tipo, ctxInfo, jid, isGroup, sender, bot, isDono, isAdm, isBotAdm, meta: metaG, texto, cfg, alvos, plugins, lista, num, recarregar: carregar,
    r: (l, ex = {}) => {
      const { titulo, ...resto } = ex;
      const emo = emojiDoCmd(c.cmd);
      const linhas = Array.isArray(l) ? l : [l];
      const comEmoji = linhas.map((x,i) => i===0 ? `${emo} ${x}` : x);
      return sock.sendMessage(jid, { text: moldura(comEmoji, titulo), ...resto }, { quoted: msg });
    }
  };
  for (const p of lista) { if (typeof p.onMessage === 'function') { try { await p.onMessage(c); } catch {} } }
  const pre = cfg.prefixo || '.';
  if (!texto.startsWith(pre)) return;
  const [cmd, ...args] = texto.slice(pre.length).trim().split(/\s+/);
  c.cmd = (cmd || '').toLowerCase(); c.args = args; c.q = args.join(' ');
  if (!c.cmd) return;
  args.forEach(a => { if (/^\d{8,15}$/.test(a)) alvos.push(a + '@s.whatsapp.net'); });
  const p = plugins.get(c.cmd);
  if (!p && c.cmd !== 'menu') return;
  if (cfg.ligado === false && !isDono) return;
  if (isGroup) {
    let alugados = []; try { alugados = ler('alugados.json', []); } catch {}
    const ehAlugado = alugados.includes(jid);
    if (!ehAlugado) {
      if (c.cmd === 'alugar' && isDono) {} else {
        let aluguel = null; try { aluguel = require('./plugins/aluguel'); } catch {}
        const aviso = aluguel && typeof aluguel.negado === 'function' ? aluguel.negado(cfg) : `🩸 💰 ESSE GRUPO NÃO TEM ALUGUEL ATIVO ❌\n👁️ Contate: wa.me/258852223969`;
        return sock.sendMessage(jid, { text: aviso }, { quoted: msg });
      }
    }
    if (ehAlugado && COMANDOS_ALUGUEL.includes(c.cmd) && !isDono) {
      return c.r([`🚫 Só meu Dono N3 pode usar .${c.cmd}`, 'Frio. Direto. Sombrio.']);
    }
  }
  if (!isGroup && !isDono && cfg.bloquearPVsemGratis && !LIVRES.includes(c.cmd)) {
    let gratis = null; try { gratis = require('./plugins/gratis'); } catch {}
    if (gratis && typeof gratis.livre === 'function' && !gratis.livre(jid)) {
      return c.r(['Sem acesso, sem poder.', 'Digite .gratis para teste 1 dia.']);
    }
  }
  try {
    if (c.cmd === 'menu') { await menu(c); }
    else { if (typeof p.run !== 'function') throw new Error('Comando sem função run'); await p.run(c); }
    for (const h of lista) { if (typeof h.aposComando === 'function') { try { await h.aposComando(c); } catch {} } }
  } catch (e) {
    console.log('❌', c.cmd, e.message);
    c.r([`${emojiDoCmd(c.cmd)} O Sharingan falhou...`, e.message]).catch(() => {});
  }
}

let sockAtual = null; let reconectando = false;
function agendarReconexao() {
  if (reconectando) return; reconectando = true;
  setTimeout(() => { reconectando = false; conectar().catch(e => { console.log('Erro ao reconectar:', e.message); agendarReconexao(); }); }, 3000);
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
      if (code === DisconnectReason.loggedOut) { console.log('Sessão encerrada: apague a pasta auth e reinicie o bot'); }
      else { console.log(`Conexão fechada (${code ?? 'sem código'}). Reconectando...`); agendarReconexao(); }
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) { try { await tratar(sock, msg); } catch (e) { console.log('erro:', e.message); } }
  });
  sock.ev.on('group-participants.update', u => { lista.forEach(p => { try { Promise.resolve(p.onParticipants?.(sock, u)).catch(() => {}); } catch {} }); });
  sock.ev.on('groups.upsert', gs => { gs.forEach(g => lista.forEach(p => { try { Promise.resolve(p.onGrupo?.(sock, g)).catch(() => {}); } catch {} })); });
}
carregar();
conectar().catch(e => { console.log('Erro ao iniciar:', e.message); agendarReconexao(); });