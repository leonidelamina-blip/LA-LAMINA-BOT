'use strict';
/*
  SASUKE V20 - LAMINA SOMBRIO
  Baileys 6.7.8 | Prefixo "." | Formato 10 ultra personalizado
*/
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const QRCode = require('qrcode');
const qrTerminal = require('qrcode-terminal');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');

const config = require('./config.json');

// ───────────────────────── CONSTANTES ─────────────────────────
const P = config.prefixo || '.';
const AUTH_DIR = path.join(__dirname, 'auth');
const SESS_DIR = path.join(__dirname, 'sessoes');
const MEDIA_DIR = path.join(__dirname, 'media');
const START = Math.floor(Date.now() / 1000);
const DIA = 86400000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FILES = {
  contador: path.join(__dirname, 'contador.json'),
  alugados: path.join(__dirname, 'alugados.json'),
  gratis: path.join(__dirname, 'gratis.json'),
};

const FRASES = [
  'Meu ódio é mais profundo que o seu.',
  'Hn. Fraco.',
  'Frio. Direto. Sombrio.',
  'O Sharingan vê tudo.',
];
const frase = () => FRASES[Math.floor(Math.random() * FRASES.length)];

// ───────────────────────── JSON / BANCO ─────────────────────────
function lerJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}
function salvarJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Erro ao salvar', file, e.message);
  }
}
for (const f of Object.values(FILES)) if (!fs.existsSync(f)) salvarJSON(f, {});
const db = {
  contador: lerJSON(FILES.contador),
  alugados: lerJSON(FILES.alugados),
  gratis: lerJSON(FILES.gratis),
};
const salvarDB = () => {
  salvarJSON(FILES.contador, db.contador);
  salvarJSON(FILES.alugados, db.alugados);
  salvarJSON(FILES.gratis, db.gratis);
};

// ───────────────────────── FONTE MONO + MOLDURA ─────────────────────────
function monoRaw(s) {
  let out = '';
  for (const ch of String(s).normalize('NFD')) {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) out += String.fromCodePoint(0x1d670 + (c - 65));
    else if (c >= 97 && c <= 122) out += String.fromCodePoint(0x1d68a + (c - 97));
    else if (c >= 48 && c <= 57) out += String.fromCodePoint(0x1d7f6 + (c - 48));
    else out += ch;
  }
  return out;
}
// links, JIDs e @menções ficam intactos (para continuarem clicáveis)
const POUPAR = /(https?:\/\/\S+|wa\.me\/\S+|[\w.:-]+@(?:g\.us|s\.whatsapp\.net|lid)|@\d+)/g;
function mono(text) {
  return String(text)
    .split(POUPAR)
    .map((parte, i) => (i % 2 === 1 ? parte : monoRaw(parte)))
    .join('');
}

function moldura(linhas, titulo) {
  const out = ['╭─━━━─━━━─━━━─━⛩️🩸', `│  🩸  ${mono(titulo)}`];
  for (const l of [].concat(linhas).join('\n').split('\n')) out.push(`│  ⛩️  ${mono(l)}`);
  out.push('╰─━━━─━━━─━━━─━⛩️🩸', '      🩸🩸🩸', mono(frase()));
  return out.join('\n');
}
function bloco(titulo, linhas) {
  return [
    `╭─━━━─━━━⛩️🩸 ${mono(titulo)}`,
    ...linhas.map((l) => `│  ⛩️  ${mono(l)}`),
    '╰─━━━─━━━⛩️🩸',
  ].join('\n');
}

// ───────────────────────── UTILIDADES ─────────────────────────
const jidNum = (jid) => String(jid || '').split('@')[0].split(':')[0];
const fmtData = (ts) =>
  new Date(ts).toLocaleString('pt-BR', { timeZone: 'Africa/Maputo' });
function fmtDur(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${sec}s`].filter(Boolean).join(' ');
}
function tsNum(t) {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  if (typeof t.toNumber === 'function') return t.toNumber();
  return Number(t.low) || 0;
}
function unwrap(m) {
  let x = m;
  for (let i = 0; i < 5 && x; i++) {
    if (x.ephemeralMessage) x = x.ephemeralMessage.message;
    else if (x.documentWithCaptionMessage) x = x.documentWithCaptionMessage.message;
    else break;
  }
  return x;
}
function getBody(m) {
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  );
}
function getCtx(m) {
  if (!m) return null;
  for (const k of Object.keys(m)) {
    const v = m[k];
    if (v && typeof v === 'object' && v.contextInfo) return v.contextInfo;
  }
  return null;
}

// ───────────────────────── ALUGUEL / GRÁTIS ─────────────────────────
function statusGrupo(jid) {
  const now = Date.now();
  const a = db.alugados[jid];
  if (a && a.expira > now) return { tipo: 'alugado', expira: a.expira };
  const g = db.gratis[jid];
  if (g && g.expira > now) return { tipo: 'gratis', expira: g.expira };
  return null;
}
function anuncio() {
  return moldura(
    [
      'Fique por dentro das novidades do Sasuke.',
      'Canal oficial:',
      config.canal,
      'Quer o bot no seu grupo? Fale com o dono:',
      'wa.me/' + config.numeroDono,
    ],
    'COMUNICADO GERAL'
  );
}

// ───────────────────────── SESSÕES (principal, pareamento, QR) ─────────────────────────
const sessions = new Map();

function matarSessao(key, dir) {
  const rec = sessions.get(key);
  if (rec) {
    rec.closing = true;
    try {
      rec.sock.end(undefined);
    } catch {}
    sessions.delete(key);
  }
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

async function enviarCodigo(o, code) {
  const cod = String(code).match(/.{1,4}/g).join('-');
  await o.origin.sendMessage(o.chatJid, {
    text: moldura(
      [
        `Número: ${o.number}`,
        'Abra o WhatsApp > Aparelhos conectados',
        'Conectar com número de telefone',
        'Digite o código abaixo (expira em 1 min)',
      ],
      'CÓDIGO DE PAREAMENTO'
    ),
  });
  // código em texto puro (sem fonte mono) para poder copiar/digitar
  await o.origin.sendMessage(o.chatJid, { text: cod });
}

async function enviarQR(o, qr) {
  qrTerminal.generate(qr, { small: true });
  const url = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
  const buf = Buffer.from(url.split(',')[1], 'base64');
  await o.origin.sendMessage(o.chatJid, {
    image: buf,
    caption: moldura(
      ['Escaneie em Aparelhos conectados', 'Conectar um aparelho', 'Expira em 40 segundos'],
      'QR CODE'
    ),
  });
}

async function startSession(o) {
  const { dir, key, mode } = o;
  fs.mkdirSync(dir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(dir);
  let version;
  try {
    version = (await fetchLatestBaileysVersion()).version;
  } catch {}

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  });

  const rec = { sock, closing: false };
  sessions.set(key, rec);
  let pediuCodigo = false;

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('group-participants.update', (u) => extras.participantes(sock, u).catch((e) => console.error(e.message)));
  sock.ev.on('messages.upsert', (u) => tratar(sock, u).catch((e) => console.error(e)));

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u;

    if (qr) {
      if (mode === 'qr') {
        try {
          await enviarQR(o, qr);
        } catch (e) {
          console.error('Erro QR:', e.message);
        }
      } else if ((mode === 'main' || mode === 'pair') && !pediuCodigo && !sock.authState.creds.registered) {
        pediuCodigo = true;
        try {
          const code = await sock.requestPairingCode(o.number);
          if (mode === 'main') {
            console.log('\n🩸 ═══════════════════════════════════════');
            console.log(`🩸 CÓDIGO DE PAREAMENTO (${o.number}): ${String(code).match(/.{1,4}/g).join('-')}`);
            console.log('🩸 WhatsApp > Aparelhos conectados > Conectar com número de telefone');
            console.log('🩸 ═══════════════════════════════════════\n');
          } else {
            await enviarCodigo(o, code);
          }
        } catch (e) {
          console.error('Erro ao pedir pairing code:', e.message);
          if (mode === 'pair') {
            await o.origin
              .sendMessage(o.chatJid, {
                text: moldura(['Não consegui gerar o código.', 'Tente novamente em instantes.'], 'ERRO'),
              })
              .catch(() => {});
            matarSessao(key, dir);
          }
        }
      }
    }

    if (connection === 'open') {
      console.log(`🩸 [${key}] conectado como ${jidNum(sock.user?.id)}`);
      if (mode === 'main' && !o.lidsAprendidos) {
        o.lidsAprendidos = true;
        (async () => {
          for (const n of new Set(config.donos.filter((x) => x.startsWith('258') && x.length === 12))) {
            try {
              const r = await sock.onWhatsApp(n + '@s.whatsapp.net');
              const lid = r?.[0]?.lid;
              if (lid) {
                LIDS.add(jidNum(lid));
                LID_MAP.set(jidNum(lid), n);
                console.log('🩸 LID do dono aprendido:', n, '->', jidNum(lid));
              }
            } catch {}
          }
        })();
      }
      if (mode === 'main' && !o.nomeDefinido) {
        o.nomeDefinido = true;
        try {
          await sock.updateProfileName(config.nomeBot);
        } catch {}
      }
      if ((mode === 'pair' || mode === 'qr') && !o.done) {
        o.done = true;
        const num = jidNum(sock.user?.id);
        o.origin
          .sendMessage(o.chatJid, {
            text: moldura([`Número conectado: ${num}`, 'O Sasuke agora serve também nessa conta.'], 'CONECTADO'),
          })
          .catch(() => {});
      }
      if (mode === 'qr' && !o.renomeado) {
        o.renomeado = true;
        const num = jidNum(sock.user?.id);
        setTimeout(async () => {
          try {
            rec.closing = true;
            try {
              sock.end(undefined);
            } catch {}
            sessions.delete(key);
            await sleep(1500);
            const novo = path.join(SESS_DIR, num);
            if (novo !== dir) {
              fs.rmSync(novo, { recursive: true, force: true });
              fs.renameSync(dir, novo);
            }
            startSession({ ...o, dir: novo, key: num, mode: 'sub' });
          } catch (e) {
            console.error('Erro ao renomear sessão QR:', e.message);
          }
        }, 3000);
      }
    }

    if (connection === 'close') {
      if (rec.closing) return;
      const code = lastDisconnect?.error?.output?.statusCode;
      const deslogado = code === DisconnectReason.loggedOut;
      sessions.delete(key);
      if (deslogado) {
        console.log(`🩸 [${key}] sessão encerrada (logout).`);
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch {}
        if (mode === 'main') setTimeout(() => startSession(o).catch(console.error), 3000);
        return;
      }
      const registrada = sock.authState.creds.registered;
      if (registrada || mode === 'main') {
        setTimeout(() => startSession(o).catch(console.error), 3000);
      } else {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch {}
      }
    }
  });

  return sock;
}

function carregarSessoes() {
  if (!fs.existsSync(SESS_DIR)) return;
  let i = 0;
  for (const nome of fs.readdirSync(SESS_DIR)) {
    const dir = path.join(SESS_DIR, nome);
    const credsFile = path.join(dir, 'creds.json');
    if (!fs.existsSync(credsFile)) continue;
    try {
      const c = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
      if (!c.registered) {
        fs.rmSync(dir, { recursive: true, force: true });
        continue;
      }
    } catch {
      continue;
    }
    setTimeout(() => startSession({ dir, key: nome, mode: 'sub' }).catch(console.error), 2000 * ++i);
  }
}

// ───────────────────────── ENVIO COM FOTO ─────────────────────────
async function enviarComFoto(c, arquivoLocal, url, caption, mentions) {
  const local = path.join(MEDIA_DIR, arquivoLocal);
  const image = fs.existsSync(local) ? fs.readFileSync(local) : { url };
  try {
    await c.sock.sendMessage(c.from, { image, caption, mentions }, { quoted: c.msg });
  } catch (e) {
    console.error('Falha ao enviar foto (' + arquivoLocal + '):', e.message, '| arquivo local existe:', fs.existsSync(local));
    await c.sock.sendMessage(c.from, { text: caption, mentions }, { quoted: c.msg });
  }
}

// ───────────────────────── DONO / LID ─────────────────────────
// O WhatsApp identifica participantes de grupo por LID (ex: 123456@lid), não pelo número.
const LIDS = new Set((config.donosLid || []).map(String));
const LID_MAP = new Map(); // LID -> número real
const metaMem = new Map();
async function metaRapida(sock, jid) {
  const c = metaMem.get(jid);
  if (c && Date.now() - c.t < 60000) return c.m;
  const m = await sock.groupMetadata(jid);
  metaMem.set(jid, { t: Date.now(), m });
  return m;
}
const ehDonoNum = (n) => !!n && (config.donos.includes(String(n)) || LIDS.has(String(n)));
function ehDonoJid(jid) {
  const n = jidNum(jid);
  return ehDonoNum(n) || ehDonoNum(LID_MAP.get(n));
}
const soPn = (v) => (v && String(v).endsWith('@s.whatsapp.net') ? v : null);
async function numeroReal(sock, msg, from, isGroup) {
  const k = msg.key;
  for (const v of [k.participantPn, k.participantAlt, k.senderPn, k.remoteJidAlt]) if (soPn(v)) return jidNum(v);
  const id = isGroup ? k.participant : from;
  if (!id) return '';
  if (!String(id).endsWith('@lid')) return jidNum(id);
  const lidNum = jidNum(id);
  if (LID_MAP.has(lidNum)) return LID_MAP.get(lidNum);
  let pn = null;
  try {
    pn = soPn(await sock.signalRepository?.lidMapping?.getPNForLID?.(id));
  } catch {}
  if (!pn && isGroup) {
    try {
      const meta = await metaRapida(sock, from);
      const p = meta.participants.find((x) => x.id === id || x.lid === id);
      if (p) pn = [p.phoneNumber, p.jid, p.pn, p.id].map(soPn).find(Boolean) || null;
    } catch {}
  }
  if (pn) {
    LID_MAP.set(lidNum, jidNum(pn));
    return jidNum(pn);
  }
  return lidNum;
}
function idsDe(p) {
  return [p.id, p.lid, p.jid, p.phoneNumber, p.pn].filter(Boolean).map(jidNum);
}
const mesmoParticipante = (p, c) => idsDe(p).some((x) => x === c.senderNum || x === c.num);
const idsDoBot = (sock) => [jidNum(sock.user?.id), jidNum(sock.user?.lid || '')].filter(Boolean);

// ───────────────────────── HELPERS DE COMANDO ─────────────────────────
async function exigirGrupo(c) {
  if (!c.isGroup) {
    await c.send(['Este comando só funciona em grupos.'], 'ERRO');
    return false;
  }
  return true;
}
async function exigirAdmin(c) {
  if (!(await exigirGrupo(c))) return null;
  const meta = await c.sock.groupMetadata(c.from);
  const ehAdmin = meta.participants.some((p) => p.admin && mesmoParticipante(p, c));
  if (!c.owner && !ehAdmin) {
    await c.send(['Apenas administradores podem usar.'], 'SEM PERMISSÃO');
    return null;
  }
  return meta;
}
async function exigirDono(c) {
  if (!c.owner) {
    await c.send(['Apenas o dono supremo pode usar.'], 'SEM PERMISSÃO');
    return false;
  }
  return true;
}
function alvo(c) {
  const ctx = getCtx(unwrap(c.msg.message));
  if (ctx?.mentionedJid?.[0]) return ctx.mentionedJid[0];
  if (ctx?.quotedMessage && ctx.participant) return ctx.participant;
  const d = (c.args[0] || '').replace(/\D/g, '');
  if (d.length >= 9) return d + '@s.whatsapp.net';
  return null;
}
async function atualizarParticipante(c, acao, tituloOk, verbo) {
  const meta = await exigirAdmin(c);
  if (!meta) return;
  const t = alvo(c);
  if (!t) return c.send(['Marque ou responda a mensagem do alvo.'], 'ERRO');
  const tn = jidNum(t);
  if (acao === 'remove') {
    if (ehDonoJid(t)) return c.send(['Não toco no meu mestre.'], 'NEGADO');
    if (idsDoBot(c.sock).includes(tn)) return c.send(['Não vou me eliminar.'], 'NEGADO');
  }
  try {
    const r = await c.sock.groupParticipantsUpdate(c.from, [t], acao);
    if (r?.[0]?.status && String(r[0].status) !== '200') throw new Error('status ' + r[0].status);
    await c.send([`@${tn} ${verbo}.`], tituloOk, { mentions: [t] });
  } catch {
    await c.send(['Falhei. Preciso ser administrador do grupo.'], 'ERRO');
  }
}

// ───────────────────────── COMANDOS ─────────────────────────
const COMANDOS = {
  async menu(c) {
    const nBot = config.numeroBot.replace(/^258/, '');
    const nDono = config.numeroDono.replace(/^258/, '');
    const cab = [
      '╭─━━━─━━━─━━━─━⛩️🩸',
      `│  🩸  ${mono('SASUKE V20 - LAMINA SOMBRIO')}`,
      `│  ⛩️  ${mono('Bot: ' + nBot)}`,
      `│  ⛩️  ${mono('Dono: ' + nDono + ' - ' + config.nomeDono)}`,
      `│  ⛩️  ${mono('Prefixo: ' + P)}`,
      '╰─━━━─━━━─━━━─━⛩️🩸',
      '      🩸🩸🩸',
      mono(frase()),
    ].join('\n');
    await enviarComFoto(c, 'sasuke.jpg', config.imagemMenu, cab);
    const [membros, admins] = extras.menuTextos();
    await c.sock.sendMessage(c.from, { text: membros + '\n      🩸🩸🩸' }, { quoted: c.msg });
    await c.sock.sendMessage(c.from, { text: admins + '\n      🩸🩸🩸\n' + mono(frase()) }, { quoted: c.msg });
  },

  async bot(c) {
    const caption = moldura(
      [
        `Bot: Sasuke ${config.numeroBot.replace(/^258/, '')}`,
        `Dono: ${config.nomeDono} ${config.numeroDono.replace(/^258/, '')}`,
        `Versão: ${config.versao}`,
        `Uptime: ${fmtDur(process.uptime() * 1000)}`,
        'Canal:',
        config.canal,
      ],
      'SASUKE BOT'
    );
    await enviarComFoto(c, 'bot.jpg', config.imagemBot, caption);
  },

  async dono(c) {
    const caption = moldura(
      [
        `Dono Supremo N3 ${config.nomeDono}`,
        config.numeroDono.replace(/^258/, ''),
        'wa.me/' + config.numeroDono,
        'Os Uchiha não perdoam.',
      ],
      'DONO SUPREMO'
    );
    await enviarComFoto(c, 'dono.jpg', config.imagemDono, caption);
  },

  async ping(c) {
    const t0 = Date.now();
    await c.sock.sendPresenceUpdate('composing', c.from).catch(() => {});
    const ms = Date.now() - t0;
    await c.send([`Latência: ${ms}ms`, `Uptime: ${fmtDur(process.uptime() * 1000)}`], 'PING');
  },

  async id(c) {
    const ctx = getCtx(unwrap(c.msg.message));
    const linhas = [`Chat: ${c.from}`, `Você: ${c.sender}`];
    if (ctx?.participant) linhas.push(`Citado: ${ctx.participant}`);
    await c.send(linhas, 'IDENTIDADE');
  },

  async sasuke(c) {
    await c.send(
      [
        'Eu sou Sasuke Uchiha.',
        'Vingança é só o começo.',
        `Versão: ${config.versao}`,
        `Online há: ${fmtDur(process.uptime() * 1000)}`,
        `Sessões ativas: ${sessions.size}`,
      ],
      'SASUKE'
    );
  },

  async revelar(c) {
    const q = getCtx(unwrap(c.msg.message))?.quotedMessage;
    if (!q) return c.send(['Responda a uma mensagem de visualização única.'], 'ERRO');
    const inner =
      q.viewOnceMessageV2?.message ||
      q.viewOnceMessage?.message ||
      q.viewOnceMessageV2Extension?.message ||
      q;
    const tipo = ['imageMessage', 'videoMessage', 'audioMessage'].find((t) => inner[t]);
    if (!tipo) return c.send(['Nenhuma mídia encontrada na mensagem.'], 'ERRO');
    try {
      const stream = await downloadContentFromMessage(inner[tipo], tipo.replace('Message', ''));
      const chunks = [];
      for await (const ch of stream) chunks.push(ch);
      const buf = Buffer.concat(chunks);
      const caption = moldura(['O Sharingan revelou.'], 'REVELADO');
      if (tipo === 'imageMessage')
        await c.sock.sendMessage(c.from, { image: buf, caption }, { quoted: c.msg });
      else if (tipo === 'videoMessage')
        await c.sock.sendMessage(c.from, { video: buf, caption }, { quoted: c.msg });
      else {
        await c.sock.sendMessage(c.from, { audio: buf, mimetype: 'audio/mp4', ptt: false }, { quoted: c.msg });
        await c.send(['O Sharingan revelou.'], 'REVELADO');
      }
    } catch {
      await c.send(['Não consegui revelar. A mídia expirou.'], 'ERRO');
    }
  },

  // ── Conexão ──
  async pareamento(c) {
    let num = (c.args[0] || '').replace(/\D/g, '');
    if (num.length === 9) num = '258' + num;
    if (num.length < 10 || num.length > 15) {
      return c.send(['Use: .pareamento258XXXXXXXXX', 'Ou: .pareamento 258XXXXXXXXX'], 'PAREAMENTO');
    }
    if (sessions.has(num)) return c.send(['Esse número já está conectado ao Sasuke.'], 'PAREAMENTO');
    if (sessions.size >= (config.maxSessoes || 20)) return c.send(['Limite de sessões atingido.'], 'ERRO');
    await c.send([`Preparando o ritual para ${num}...`], 'PAREAMENTO');
    startSession({
      dir: path.join(SESS_DIR, num),
      key: num,
      mode: 'pair',
      number: num,
      origin: c.sock,
      chatJid: c.from,
      done: false,
    }).catch((e) => console.error(e));
  },

  async qrcode(c) {
    if (sessions.size >= (config.maxSessoes || 20)) return c.send(['Limite de sessões atingido.'], 'ERRO');
    const id = 'qr_' + Date.now();
    const o = {
      dir: path.join(SESS_DIR, id),
      key: id,
      mode: 'qr',
      origin: c.sock,
      chatJid: c.from,
      done: false,
    };
    await c.send(['Gerando QR Code...', 'Expira em 40 segundos.'], 'QRCODE');
    startSession(o).catch((e) => console.error(e));
    setTimeout(async () => {
      if (!o.done) {
        matarSessao(o.key, o.dir);
        await c.sock
          .sendMessage(c.from, {
            text: moldura(['O QR Code expirou.', 'Use .qrcode para gerar outro.'], 'EXPIRADO'),
          })
          .catch(() => {});
      }
    }, 40000);
  },

  // ── Aluguel / grátis ──
  async gratis(c) {
    if (!(await exigirGrupo(c))) return;
    const now = Date.now();
    const al = db.alugados[c.from];
    if (al && al.expira > now)
      return c.send(['Este grupo já possui aluguel ativo.', `Expira: ${fmtData(al.expira)}`], 'GRATIS');
    const g = db.gratis[c.from];
    if (g && g.expira > now)
      return c.send(['O modo grátis já está ativo.', `Restam: ${fmtDur(g.expira - now)}`], 'GRATIS');
    if (g && g.usadoEm && now - g.usadoEm < 30 * DIA) {
      const falta = Math.ceil((30 * DIA - (now - g.usadoEm)) / DIA);
      return c.send(
        ['Este grupo já usou o modo grátis.', `Disponível novamente em ${falta} dia(s).`, 'Use .alugar para continuar.'],
        'GRATIS NEGADO'
      );
    }
    db.gratis[c.from] = { expira: now + DIA, usadoPor: c.sender, usadoEm: now, usado: true };
    db.contador[c.from] = 0;
    salvarDB();
    await c.send(
      [`@${c.senderNum} ativou o modo grátis.`, 'Duração: 24 horas.', `Expira: ${fmtData(now + DIA)}`],
      'GRATIS ATIVADO',
      { mentions: [c.sender] }
    );
  },

  async alugar(c) {
    if (!c.owner) {
      return c.send(
        ['Quer o Sasuke no seu grupo?', 'Fale com o dono:', 'wa.me/' + config.numeroDono, 'Ou use .gratis para 1 dia.'],
        'ALUGUEL'
      );
    }
    if (!(await exigirGrupo(c))) return;
    const dias = parseInt(c.args[0], 10) || 30;
    if (dias < 1 || dias > 3650) return c.send(['Informe de 1 a 3650 dias.'], 'ERRO');
    const base = Math.max(Date.now(), db.alugados[c.from]?.expira || 0);
    db.alugados[c.from] = { expira: base + dias * DIA, por: c.senderNum, em: Date.now() };
    salvarDB();
    await c.send(
      [`Aluguel ativado: ${dias} dia(s).`, `Expira: ${fmtData(base + dias * DIA)}`],
      'ALUGUEL ATIVO'
    );
  },

  async desaprovar(c) {
    if (!(await exigirDono(c))) return;
    if (!(await exigirGrupo(c))) return;
    const tinha = !!(db.alugados[c.from] || db.gratis[c.from]);
    delete db.alugados[c.from];
    delete db.gratis[c.from];
    delete db.contador[c.from];
    salvarDB();
    await c.send(
      tinha ? ['Aluguel e modo grátis removidos.', 'Grupo sem acesso.'] : ['Este grupo não tinha aluguel nem grátis.'],
      'DESAPROVADO'
    );
  },

  async alugados(c) {
    if (!(await exigirDono(c))) return;
    const now = Date.now();
    const linhas = [];
    const itens = [
      ...Object.entries(db.alugados).filter(([, v]) => v.expira > now).map(([j, v]) => ['ALUGADO', j, v.expira]),
      ...Object.entries(db.gratis).filter(([, v]) => v.expira > now).map(([j, v]) => ['GRATIS', j, v.expira]),
    ].slice(0, 30);
    for (const [tipo, jid, exp] of itens) {
      let nome = jid;
      try {
        nome = (await c.sock.groupMetadata(jid)).subject;
      } catch {}
      linhas.push(`${tipo}: ${nome}`, `   restam ${fmtDur(exp - now)}`);
    }
    await c.send(linhas.length ? linhas : ['Nenhum grupo ativo.'], 'ALUGADOS');
  },

  // ── Grupo ──
  async infogrupo(c) {
    if (!(await exigirGrupo(c))) return;
    const meta = await c.sock.groupMetadata(c.from);
    const admins = meta.participants.filter((p) => p.admin).length;
    const st = statusGrupo(c.from);
    await c.send(
      [
        `Nome: ${meta.subject}`,
        `ID: ${c.from}`,
        `Membros: ${meta.participants.length}`,
        `Admins: ${admins}`,
        `Criado: ${meta.creation ? fmtData(meta.creation * 1000) : '?'}`,
        `Mensagens: ${meta.announce ? 'só admins' : 'todos'}`,
        `Plano: ${st ? st.tipo + ' - restam ' + fmtDur(st.expira - Date.now()) : 'nenhum'}`,
        `Descrição: ${(meta.desc || 'sem descrição').slice(0, 120)}`,
      ],
      'INFO DO GRUPO'
    );
  },

  async kick(c) {
    await atualizarParticipante(c, 'remove', 'ELIMINADO', 'foi eliminado');
  },
  async promover(c) {
    await atualizarParticipante(c, 'promote', 'PROMOVIDO', 'agora é administrador');
  },
  async rebaixar(c) {
    await atualizarParticipante(c, 'demote', 'REBAIXADO', 'perdeu o cargo de administrador');
  },

  async abrir(c) {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    try {
      await c.sock.groupSettingUpdate(c.from, 'not_announcement');
      await c.send(['Grupo aberto. Todos podem falar.'], 'GRUPO ABERTO');
    } catch {
      await c.send(['Preciso ser administrador.'], 'ERRO');
    }
  },
  async fechar(c) {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    try {
      await c.sock.groupSettingUpdate(c.from, 'announcement');
      await c.send(['Grupo fechado. Silêncio.'], 'GRUPO FECHADO');
    } catch {
      await c.send(['Preciso ser administrador.'], 'ERRO');
    }
  },

  async link(c) {
    if (!(await exigirGrupo(c))) return;
    try {
      const code = await c.sock.groupInviteCode(c.from);
      await c.send(['https://chat.whatsapp.com/' + code], 'LINK DO GRUPO');
    } catch {
      await c.send(['Preciso ser administrador para gerar o link.'], 'ERRO');
    }
  },

  async hidetag(c) {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const ctx = getCtx(unwrap(c.msg.message));
    let txt = c.args.join(' ');
    if (!txt && ctx?.quotedMessage)
      txt = ctx.quotedMessage.conversation || ctx.quotedMessage.extendedTextMessage?.text || '';
    if (!txt) txt = 'O Sasuke chama.';
    await c.send([txt], 'AVISO', { mentions: meta.participants.map((p) => p.id) });
  },

  async tagall(c) {
    const meta = await exigirAdmin(c);
    if (!meta) return;
    const linhas = [];
    if (c.args.length) linhas.push(c.args.join(' '));
    for (const p of meta.participants) linhas.push(`@${jidNum(p.id)}`);
    await c.send(linhas, 'CHAMADO GERAL', { mentions: meta.participants.map((p) => p.id) });
  },
};

const ALIAS = {
  criador: 'dono',
  qr: 'qrcode',
  qrc: 'qrcode',
  desalugar: 'desaprovar',
  anular: 'desaprovar',
  removergratis: 'desaprovar',
  ban: 'kick',
  'tag-all': 'tagall',
  todos: 'tagall',
};

// comandos liberados em grupos sem aluguel
const LIVRES = ['gratis', 'menu', 'dono', 'bot', 'ping', 'pareamento', 'qrcode', 'alugar', 'desaprovar'];

// ───────────────────────── EXTRAS (compras, ferramentas, moderação...) ─────────────────────────
const extras = require('./extras')({
  config, P, mono, moldura, bloco, jidNum, fmtData, fmtDur, getCtx, unwrap,
  exigirGrupo, exigirAdmin, alvo, statusGrupo, DIA, downloadContentFromMessage,
  ehDonoJid, ehDonoNum, idsDe, idsDoBot, db, sessions,
});
for (const [k, v] of Object.entries(extras.comandos)) if (!COMANDOS[k]) COMANDOS[k] = v;
Object.assign(ALIAS, extras.alias);
LIVRES.push(...extras.livres);

// ───────────────────────── PROCESSAMENTO DE MENSAGENS ─────────────────────────
async function tratar(sock, upsert) {
  if (upsert.type !== 'notify') return;
  for (const msg of upsert.messages) {
    try {
      await processar(sock, msg);
    } catch (e) {
      console.error('Erro no comando:', e);
    }
  }
}

async function processar(sock, msg) {
  if (!msg.message) return;
  const from = msg.key.remoteJid;
  if (!from || from === 'status@broadcast' || from.endsWith('@newsletter') || from.endsWith('@broadcast')) return;
  const t = tsNum(msg.messageTimestamp);
  if (t && t < START - 30) return;

  const m = unwrap(msg.message);
  if (!m) return;
  const body = getBody(m).trim();

  const isGroup = from.endsWith('@g.us');
  const sender = msg.key.fromMe ? sock.user.id : isGroup ? msg.key.participant : from;
  const senderNum = jidNum(sender);
  const num = msg.key.fromMe
    ? jidNum(sock.user.id)
    : await numeroReal(sock, msg, from, isGroup).catch(() => senderNum);
  const owner = !!msg.key.fromMe || ehDonoNum(num) || ehDonoNum(senderNum);

  // moderação, anti-link, auto-responder etc.
  if (isGroup && !msg.key.fromMe) {
    const parar = await extras
      .antes(sock, msg, { from, sender, senderNum, num, owner, body, m })
      .catch((e) => {
        console.error('erro hook:', e.message);
        return false;
      });
    if (parar) return;
  }

  if (!body.startsWith(P)) return;
  const raw = body.slice(P.length).trim();
  if (!raw) return;

  let cmd;
  let args;
  const pm = raw.match(/^pareamento\s*([\d+\s-]*)$/i);
  if (pm) {
    cmd = 'pareamento';
    args = [pm[1].replace(/\D/g, '')];
  } else {
    const partes = raw.split(/\s+/);
    cmd = partes.shift().toLowerCase();
    args = partes;
  }
  cmd = ALIAS[cmd] || cmd;

  const send = (linhas, titulo, extra = {}) =>
    sock.sendMessage(from, { text: moldura(linhas, titulo), ...extra }, { quoted: msg });

  let fn = COMANDOS[cmd];
  if (!fn) {
    const nano = isGroup ? extras.personalizado(from, cmd) : null;
    if (!nano) return;
    fn = async (cc) => cc.send([nano], cmd.toUpperCase());
  }

  // bloqueio de grupos sem aluguel
  if (isGroup && !LIVRES.includes(cmd) && !statusGrupo(from) && !(COMANDOS[cmd] === undefined)) {
    await send(
      [
        'Este grupo não possui aluguel ativo.',
        'Comandos bloqueados.',
        'Use .gratis para 1 dia grátis',
        'ou .alugar para alugar o Sasuke.',
      ],
      'ACESSO NEGADO'
    );
    return;
  }

  await sock.sendMessage(from, { react: { text: '🩸', key: msg.key } }).catch(() => {});

  console.log(`[cmd] ${cmd} | id=${sender} | numero=${num} | dono=${owner}`);
  const c = { sock, msg, from, sender, senderNum, num, isGroup, owner, args, body, send };
  await fn(c);

  // anúncio a cada 7 comandos no modo grátis
  if (isGroup) {
    const st = statusGrupo(from);
    if (st && st.tipo === 'gratis') {
      db.contador[from] = (db.contador[from] || 0) + 1;
      salvarJSON(FILES.contador, db.contador);
      if (db.contador[from] % 7 === 0) await sock.sendMessage(from, { text: anuncio() });
    }
  }
}

// ───────────────────────── EXPRESS ─────────────────────────
const app = express();
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => {
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);
app.get('/', (_req, res) => res.send('SASUKE V20 - LAMINA SOMBRIO online 🩸'));
app.get('/status', (_req, res) =>
  res.json({ online: true, uptime: process.uptime(), sessoes: [...sessions.keys()] })
);
app.listen(process.env.PORT || 3000, () => console.log('⛩️  Express na porta ' + (process.env.PORT || 3000)));

process.on('uncaughtException', (e) => console.error('uncaughtException:', e));
process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e));

// ───────────────────────── INÍCIO ─────────────────────────
(async () => {
  console.log('🩸 SASUKE V20 - LAMINA SOMBRIO iniciando...');
  fs.mkdirSync(SESS_DIR, { recursive: true });
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  await startSession({ dir: AUTH_DIR, key: 'main', mode: 'main', number: config.numeroBot });
  setTimeout(carregarSessoes, 5000);
  extras.iniciarTimers(() => sessions.get('main')?.sock);
})();

if (require.main !== module) module.exports = { COMANDOS, ALIAS, LIVRES, numeroReal, ehDonoNum, mesmoParticipante };
