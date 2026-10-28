// L LÂMINA SOMBRIO V20 — Versão Sasuke Uchiha
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser, normalizeMessageContent } = require('@whiskeysockets/baileys');
const pino = require('pino'), express = require('express'), fs = require('fs'), path = require('path'), qrcode = require('qrcode-terminal');
const { ler, moldura } = require('./lib/util');

// Servidor web para manter online no Replit
express().get('/', (_, r) => r.send('👁️ L LÂMINA SOMBRIO V20 online')).listen(3000, () => console.log('🌑 Servidor na porta 3000'));

// Carrega TODOS os plugins da pasta plugins/ automaticamente
const plugins = new Map(), lista = [];
function carregar() {
  plugins.clear(); lista.length = 0;
  for (const f of fs.readdirSync(path.join(__dirname, 'plugins')).filter(x => x.endsWith('.js'))) {
    const p = path.join(__dirname, 'plugins', f);
    delete require.cache[require.resolve(p)];
    const m = require(p); lista.push(m); m.cmd.forEach(c => plugins.set(c, m));
  }
  console.log(`🩸 ${lista.length} plugins carregados`);
}

const ORDEM = ['ADM', 'VENDAS', 'DOWNLOAD', 'FIGURINHAS', 'ANIME', 'GRUPO', 'IA', 'JOGOS', '+18', 'DIVERSAO', 'UTILIDADES', 'DONO'];
const LIVRES = ['gratis', 'menu', 'pagamento', 'tabela', 'canal', 'ping'];
const cacheMeta = new Map();
const meta = async (sock, jid) => {
  const k = cacheMeta.get(jid); if (k && Date.now() - k.t < 60000) return k.m;
  const m = await sock.groupMetadata(jid); cacheMeta.set(jid, { m, t: Date.now() }); return m;
};

// .menu e .menu <número da categoria>
function menu(c) {
  const cats = {}; lista.forEach(m => (cats[m.cat] ||= []).push(...m.cmd));
  const nome = ORDEM[parseInt(c.args[0]) - 1], p = c.cfg.prefixo;
  if (nome) return c.r([`🐍 ${nome} (${cats[nome].length})`, ...(nome === '+18' ? ['⚠️ Só maiores de idade.'] : []), '', ...cats[nome].map(x => p + x)], { titulo: 'L LAMINA SOMBRIO V20' });
  c.r([`Dono: ${c.cfg.donoNome}`, `Prefixo: ${p}`, `Total comandos: ${lista.reduce((s, m) => s + m.cmd.length, 0)}`, 'Estilo: Sasuke Sombrio', '',
    '🐍 ANTI-GRUPO', '🩸 BOAS-VINDAS', '👁️ ALUGUEL', '',
    ...ORDEM.map((n, i) => `${i + 1}. ${n} (${cats[n]?.length || 0})`), '', `Use ${p}menu <número>`], { titulo: 'L LAMINA SOMBRIO V20' });
}

async function tratar(sock, msg) {
  if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
  const cfg = ler('config.json', {}), jid = msg.key.remoteJid, isGroup = jid.endsWith('@g.us');
  const bot = jidNormalizedUser(sock.user.id);
  const sender = msg.key.fromMe ? bot : jidNormalizedUser(isGroup ? msg.key.participant : jid);
  const m = normalizeMessageContent(msg.message) || {};
  const tipo = Object.keys(m).find(k => k !== 'messageContextInfo');
  const texto = m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '';
  const ctxInfo = m[tipo]?.contextInfo || {};
  const num = x => String(x).split('@')[0].split(':')[0];
  const alt = msg.key.participantAlt || msg.key.remoteJidAlt || '';
  const isDono = !!msg.key.fromMe || (cfg.donos || []).some(d => d === num(sender) || d === num(alt));
  let metaG = null, isAdm = false, isBotAdm = false;
  if (isGroup) {
    try { metaG = await meta(sock, jid); } catch {}
    const adm = id => !!metaG?.participants.some(p => p.admin && num(p.id) === num(id));
    isAdm = adm(sender); isBotAdm = adm(bot);
  }
  const alvos = [...(ctxInfo.mentionedJid || []), ...(ctxInfo.participant ? [ctxInfo.participant] : [])];
  const c = {
    sock, msg, m, tipo, ctxInfo, jid, isGroup, sender, bot, isDono, isAdm, isBotAdm, meta: metaG, texto, cfg, alvos, plugins, lista, num,
    recarregar: carregar,
    r: (l, ex = {}) => { const { titulo, ...resto } = ex; return sock.sendMessage(jid, { text: moldura(l, titulo), ...resto }, { quoted: msg }); }
  };
  for (const p of lista) if (p.onMessage) await p.onMessage(c).catch(() => {});

  const pre = cfg.prefixo || '.';
  if (!texto.startsWith(pre)) return;
  const [cmd, ...args] = texto.slice(pre.length).trim().split(/\s+/);
  c.cmd = cmd.toLowerCase(); c.args = args; c.q = args.join(' ');
  args.forEach(a => { if (/^\d{8,15}$/.test(a)) alvos.push(a + '@s.whatsapp.net'); });
  const p = plugins.get(c.cmd);
  if (!p && c.cmd !== 'menu') return;
  if (cfg.ligado === false && !isDono) return;

  // Aluguel: grupo não autorizado só aceita .aluguel
  if (isGroup && c.cmd !== 'aluguel' && !ler('alugados.json', []).includes(jid))
    return sock.sendMessage(jid, { text: require('./plugins/aluguel').negado(cfg) }, { quoted: msg });
  // PV: precisa estar no teste grátis (desative em config.json → bloquearPVsemGratis)
  if (!isGroup && !isDono && cfg.bloquearPVsemGratis && !LIVRES.includes(c.cmd) && !require('./plugins/gratis').livre(jid))
    return c.r(['Sem acesso, sem poder.', 'Digite .gratis para o teste de 1 dia.']);

  try {
    if (c.cmd === 'menu') await menu(c); else await p.run(c);
    for (const h of lista) if (h.aposComando) await h.aposComando(c);
  } catch (e) {
    console.log('❌', c.cmd, e.message);
    c.r(['O Sharingan falhou...', e.message]).catch(() => {});
  }
}

async function iniciar() {
  carregar();
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const { version } = await fetchLatestBaileysVersion();
  const cfg = ler('config.json', {});
  const sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), browser: ['Ubuntu', 'Chrome', '20.0.04'] });
  // Login por código de pareamento (defina numeroBot em config.json) ou QR
  if (!sock.authState.creds.registered && cfg.numeroBot)
    setTimeout(async () => console.log('👁️ CÓDIGO DE PAREAMENTO:', await sock.requestPairingCode(cfg.numeroBot.replace(/\D/g, ''))), 3000);
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr && !cfg.numeroBot) qrcode.generate(qr, { small: true });
    if (connection === 'open') console.log('🩸 Uchiha online');
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) iniciar();
      else console.log('Sessão encerrada: apague a pasta auth e reinicie.');
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) try { await tratar(sock, msg); } catch (e) { console.log('erro:', e.message); }
  });
  sock.ev.on('group-participants.update', u => lista.forEach(p => p.onParticipants?.(sock, u)));
  sock.ev.on('groups.upsert', gs => gs.forEach(g => lista.forEach(p => p.onGrupo?.(sock, g))));
}
iniciar();