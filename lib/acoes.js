// Ações com lógica própria: { m: permissão ('g' grupo, 'a' ADM, 'd' dono), bot: exige bot ADM, f: função }
const { ler, salvar, pick, http, imagemIA, moldura } = require('./util');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const A = {}, def = (n, m, f, bot) => (A[n] = { m, f, bot });
const ids = c => c.meta.participants.map(p => p.id);
const esp = ms => new Promise(r => setTimeout(r, ms));

// ───── GRUPO / ADM ─────
const mod = (acao, txt) => async c => {
  const a = c.alvos[0]; if (!a) return c.r(['Marque o alvo. Não me faça repetir.']);
  await c.sock.groupParticipantsUpdate(c.jid, [a], acao);
  c.r([`@${c.num(a)} ${txt}`], { mentions: [a] });
};
def('ban', 'a', mod('remove', 'foi eliminado. Fraco.'), 1); A.kick = A.ban;
def('unban', 'a', mod('add', 'foi trazido de volta. Não me decepcione.'), 1);
def('promover', 'a', mod('promote', 'agora é ADM. Não me faça me arrepender.'), 1);
def('rebaixar', 'a', mod('demote', 'perdeu o cargo. Fraco.'), 1);
def('add', 'a', async c => {
  const n = (c.args[0] || '').replace(/\D/g, ''); if (!n) return c.r(['Use: .add 258XXXXXXXXX']);
  await c.sock.groupParticipantsUpdate(c.jid, [n + '@s.whatsapp.net'], 'add'); c.r(['Convite enviado.']);
}, 1);
def('link', 'a', async c => c.r(['https://chat.whatsapp.com/' + await c.sock.groupInviteCode(c.jid)]), 1);
def('revogar', 'a', async c => { await c.sock.groupRevokeInvite(c.jid); c.r(['Link antigo destruído 🩸']); }, 1);
def('fechar', 'a', async c => { await c.sock.groupSettingUpdate(c.jid, 'announcement'); c.r(['Grupo FECHADO. Silêncio.']); }, 1);
def('abrir', 'a', async c => { await c.sock.groupSettingUpdate(c.jid, 'not_announcement'); c.r(['Grupo ABERTO. Falem... se ousarem.']); }, 1);
const marca = (filtro, num) => async c => {
  const l = c.meta.participants.filter(filtro).map(p => p.id);
  c.r([c.q || 'Despertem, fracos.', '', ...l.map((i, k) => `${num ? k + 1 + '. ' : ''}@${c.num(i)}`)], { mentions: l });
};
def('marcar', 'a', marca(() => true)); def('todos', 'a', marca(() => true));
def('marcar2', 'a', marca(() => true, 1)); def('tagadm', 'g', marca(p => p.admin));
def('hidetag', 'a', async c => c.r([c.q || '👁️'], { mentions: ids(c) }));
def('info-grupo', 'g', async c => { const m = c.meta; c.r([`Nome: ${m.subject}`, `Membros: ${m.participants.length}`, `ADMs: ${m.participants.filter(p => p.admin).length}`, `Desc: ${m.desc || '—'}`]); });
def('admins', 'g', async c => { const l = c.meta.participants.filter(p => p.admin).map(p => p.id); c.r(l.map((i, k) => `${k + 1}. @${c.num(i)}`), { mentions: l }); });
def('membros', 'g', async c => c.r([`Total de fracos aqui: ${c.meta.participants.length}`]));
def('nomegp', 'a', async c => { await c.sock.groupUpdateSubject(c.jid, c.q); c.r(['Nome alterado.']); }, 1);
def('descgp', 'a', async c => { await c.sock.groupUpdateDescription(c.jid, c.q); c.r(['Descrição alterada.']); }, 1);
def('regras', 'g', async c => {
  const g = ler('grupos.json', {}); g[c.jid] ||= {};
  if (c.q) { if (!(c.isAdm || c.isDono)) return c.r(['Só ADM.']); g[c.jid].regras = c.q; salvar('grupos.json', g); return c.r(['Regras gravadas.']); }
  c.r([g[c.jid].regras || 'Sem regras. Obedeçam a mim.']);
});
def('sorteio', 'g', async c => { const i = pick(ids(c)); c.r(['O sorteado é @' + c.num(i)], { mentions: [i] }); });
def('enquete', 'a', async c => {
  const [t, ...o] = c.q.split('|').map(s => s.trim()); if (o.length < 2) return c.r(['Use: .enquete pergunta|opção1|opção2']);
  c.sock.sendMessage(c.jid, { poll: { name: t, values: o, selectableCount: 1 } });
});
def('apagar', 'a', async c => {
  if (!c.ctxInfo.stanzaId) return c.r(['Responda à mensagem que quer apagar.']);
  c.sock.sendMessage(c.jid, { delete: { remoteJid: c.jid, fromMe: false, id: c.ctxInfo.stanzaId, participant: c.ctxInfo.participant } });
}, 1);
def('fotogp', 'g', async c => {
  try { await c.sock.sendMessage(c.jid, { image: { url: await c.sock.profilePictureUrl(c.jid, 'image') }, caption: moldura(['Eis o símbolo desse grupo.']) }); } catch { c.r(['Sem foto.']); }
});
def('sairgp', 'd', async c => { await c.r(['Me desinvoquem... eu saio.']); c.sock.groupLeave(c.jid); });

// ───── FIGURINHAS ─────
const midia = async c => {
  const q = c.ctxInfo.quotedMessage, t = Object.keys(q || c.m).find(k => /image|video|sticker/i.test(k));
  if (!t) return null;
  return downloadMediaMessage(q ? { key: { remoteJid: c.jid, id: c.ctxInfo.stanzaId, participant: c.ctxInfo.participant }, message: q } : c.msg, 'buffer', {});
};
const fig = async (c, b, pack, aut) => {
  const { Sticker } = require('wa-sticker-formatter');
  const s = await new Sticker(b, { pack: pack || c.cfg.pack, author: aut || c.cfg.donoNome, type: 'full', quality: 50 }).toBuffer();
  return c.sock.sendMessage(c.jid, { sticker: s }, { quoted: c.msg });
};
const stk = async c => {
  const b = await midia(c); if (!b) return c.r(['Envie ou responda uma imagem/vídeo com o comando.']);
  const [p, a] = ['take', 'wm'].includes(c.cmd) ? c.q.split('|') : [];
  return fig(c, b, p?.trim(), a?.trim());
};
['s', 'f', 'figu', 'sticker', 'stk', 'take', 'wm'].forEach(n => def(n, '', stk));
const toimg = async c => {
  const b = await midia(c); if (!b) return c.r(['Responda a uma figurinha.']);
  return c.sock.sendMessage(c.jid, { image: await require('sharp')(b).png().toBuffer(), caption: moldura(['Pronto. Animadas viram só o 1º quadro.']) }, { quoted: c.msg });
};
def('toimg', '', toimg); def('togif', '', toimg);
// Texto → figurinha (SVG renderizado pelo sharp)
const txtFig = estilo => async c => {
  if (!c.q) return c.r(['Escreva o texto. Fraco.']);
  const ls = []; let cur = '';
  for (const w of c.q.replace(/[<>&"]/g, '').split(/\s+/)) { if ((cur + ' ' + w).trim().length > 12 && cur) { ls.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  ls.push(cur);
  const fs = Math.max(40, Math.floor(480 / Math.max(ls.length, 6)));
  const cor = estilo === 'brat' ? '#000' : estilo === 'ttp' ? '#fff' : pick(['#ff2a2a', '#ff8a00', '#00c8ff', '#b400ff', '#00ff6a']);
  const tx = ls.map((l, i) => `<text x="256" y="${256 + (i - (ls.length - 1) / 2) * fs * 1.1}" font-size="${fs}" font-family="Arial" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${cor}" ${estilo === 'brat' ? '' : 'stroke="#000" stroke-width="3"'}>${l}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${estilo === 'brat' ? '<rect width="512" height="512" fill="#8ace00"/>' : ''}${tx}</svg>`;
  return fig(c, await require('sharp')(Buffer.from(svg)).png().toBuffer());
};
['attp', 'attp2', 'ttp', 'brat'].forEach(n => def(n, '', txtFig(n)));
def('figu-ia', '', async c => { if (!c.q) return c.r(['Descreva a figurinha.']); fig(c, await imagemIA(c)); });

// ───── JOGOS / RPG ─────
const P = (d, c) => (d[c.sender] ||= { xp: 0, ouro: 0, t: 0, d: 0 });
const nv = x => Math.floor(Math.sqrt(x / 10)) + 1;
def('ppt', '', async c => {
  const o = ['pedra', 'papel', 'tesoura'], u = o.indexOf((c.args[0] || '').toLowerCase());
  if (u < 0) return c.r(['Use: .ppt pedra|papel|tesoura']);
  const b = Math.floor(Math.random() * 3);
  c.r([`Você: ${o[u]}`, `Eu: ${o[b]}`, u === b ? 'Empate.' : (u + 2) % 3 === b ? 'Você venceu... desta vez.' : 'Você perdeu. Fraco.']);
});
def('dado', '', async c => c.r([`🎲 ${1 + Math.floor(Math.random() * (+c.args[0] || 6))}`]));
def('roleta', '', async c => c.r([Math.random() < 1 / 6 ? '🔫 BANG. Você morreu 🩸' : '🔫 Click... sobreviveu.']));
def('moeda', '', async c => c.r([pick(['🪙 Cara', '🪙 Coroa'])]));
def('slot', '', async c => { const s = [0, 0, 0].map(() => pick(['🩸', '👁️', '🐍', '🌑'])); c.r([s.join(' | '), s.every(x => x === s[0]) ? 'JACKPOT.' : 'Perdeu. Fraco.']); });
def('adivinha', '', async c => { const n = 1 + Math.floor(Math.random() * 10); c.r([`Pensei em ${n}.`, +c.args[0] === n ? 'Acertou... sorte.' : 'Errou.']); });
def('parimpar', '', async c => {
  const e = (c.args[0] || '').toLowerCase(), n = +c.args[1], b = 1 + Math.floor(Math.random() * 5);
  if (!['par', 'impar', 'ímpar'].includes(e) || !n) return c.r(['Use: .parimpar par 3']);
  const par = (n + b) % 2 === 0; c.r([`Você: ${n} | Eu: ${b}`, (par === (e === 'par')) ? 'Você venceu.' : 'Perdeu. Fraco.']);
});
def('sorte', '', async c => c.r([`Seu número da sorte: ${Math.floor(Math.random() * 100)}`]));
const QZ = [['Quem é o irmão de Sasuke?', 'itachi'], ['Qual é o olho do clã Uchiha?', 'sharingan'], ['Qual técnica de raio o Kakashi criou?', 'chidori'], ['Qual a vila do Naruto?', 'konoha'], ['Quem foi o mestre cobra do Sasuke?', 'orochimaru']];
const QS = new Map();
def('quiz', '', async c => {
  const s = QS.get(c.jid);
  if (s && c.q) {
    QS.delete(c.jid);
    if (c.q.toLowerCase() !== s[1]) return c.r([`Errou. Era: ${s[1]}`]);
    const d = ler('rpg.json', {}); P(d, c).xp += 10; salvar('rpg.json', d); return c.r(['Acertou. +10 XP.']);
  }
  const q = pick(QZ); QS.set(c.jid, q); c.r([q[0], 'Responda: .quiz <resposta>']);
});
const FS = new Map();
def('forca', '', async c => {
  let s = FS.get(c.jid); const l = (c.args[0] || '').toLowerCase();
  if (!s || !l) { s = { p: pick(['sharingan', 'uchiha', 'konoha', 'akatsuki', 'chidori']), a: new Set(), e: 0 }; FS.set(c.jid, s); }
  else if (l.length === 1 && !s.a.has(l)) { s.a.add(l); if (!s.p.includes(l)) s.e++; }
  const v = [...s.p].map(x => (s.a.has(x) ? x : '_')).join(' ');
  if (!v.includes('_')) { FS.delete(c.jid); return c.r([`Acertou: ${s.p}`]); }
  if (s.e >= 6) { FS.delete(c.jid); return c.r([`Perdeu. Era: ${s.p}`]); }
  c.r([v, `Erros: ${s.e}/6`, 'Use .forca <letra>']);
});
def('rpg', '', async c => {
  const d = ler('rpg.json', {}), p = P(d, c);
  if (Date.now() - p.t < 60000) return c.r(['Descanse. Fraco demais para outra missão agora.']);
  const xp = 5 + Math.floor(Math.random() * 20), ouro = Math.floor(Math.random() * 50);
  p.xp += xp; p.ouro += ouro; p.t = Date.now(); salvar('rpg.json', d);
  c.r(['Missão cumprida 🩸', `+${xp} XP | +${ouro} ouro`, `Nível: ${nv(p.xp)}`]);
});
def('level', '', async c => { const p = P(ler('rpg.json', {}), c); c.r([`Nível ${nv(p.xp)} (${p.xp} XP)`]); });
def('perfil', '', async c => { const p = P(ler('rpg.json', {}), c); c.r([`👁️ @${c.num(c.sender)}`, `Nível: ${nv(p.xp)} | XP: ${p.xp}`, `Ouro: ${p.ouro}`], { mentions: [c.sender] }); });
def('daily', '', async c => {
  const d = ler('rpg.json', {}), p = P(d, c);
  if (Date.now() - p.d < 86400000) return c.r(['Já pegou hoje. Volte amanhã.']);
  p.d = Date.now(); p.ouro += 100; salvar('rpg.json', d); c.r(['+100 ouro. Use bem.']);
});
def('rank', '', async c => {
  const t = Object.entries(ler('rpg.json', {})).sort((a, b) => b[1].xp - a[1].xp).slice(0, 10);
  c.r(t.length ? t.map(([j, p], i) => `${i + 1}. @${c.num(j)} — ${p.xp} XP`) : ['Ninguém treinou ainda.'], { mentions: t.map(x => x[0]) });
});

// ───── DIVERSÃO / UTILIDADES ─────
def('par', 'g', async c => { const a = pick(ids(c)), b = pick(ids(c)); c.r([`💘 @${c.num(a)} + @${c.num(b)}`], { mentions: [a, b] }); });
def('calc', '', async c => {
  const e = c.q.replace(/\^/g, '**').replace(/,/g, '.');
  if (!e || !/^[\d\s+\-*/().%]+$/.test(e)) return c.r(['Só números e + - * / ( ).']);
  c.r([`${c.q} = ${Function('"use strict";return (' + e + ')')()}`]);
});
def('horario', '', async c => c.r([new Date().toLocaleString('pt-BR', { timeZone: c.cfg.fuso || 'Africa/Maputo' })]));
def('ping', '', async c => c.r([`🏓 ${Date.now() - Number(c.msg.messageTimestamp) * 1000} ms`]));
def('uptime', '', async c => c.r([`Online há ${Math.floor(process.uptime() / 60)} min`]));
def('id', '', async c => c.r([`Chat: ${c.jid}`, `Você: ${c.sender}`]));
def('base64', '', async c => c.r([Buffer.from(c.q).toString('base64')]));
def('decode64', '', async c => c.r([Buffer.from(c.q, 'base64').toString()]));
def('maiuscula', '', async c => c.r([c.q.toUpperCase()]));
def('minuscula', '', async c => c.r([c.q.toLowerCase()]));
def('contar', '', async c => c.r([`Caracteres: ${c.q.length}`, `Palavras: ${c.q.split(/\s+/).filter(Boolean).length}`]));
def('senha', '', async c => c.r([Array.from({ length: +c.args[0] || 12 }, () => 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%'[Math.floor(Math.random() * 56)]).join('')]));
def('lembrete', '', async c => {
  const m = +c.args[0], t = c.args.slice(1).join(' '); if (!m || !t) return c.r(['Use: .lembrete 10 texto (minutos)']);
  setTimeout(() => c.r([`⏰ ${t}`]), m * 60000); c.r([`Anotado. Em ${m} min.`]);
});
const cambio = b => async c => { const r = (await http('https://open.er-api.com/v6/latest/' + b)).data.rates; c.r([`1 ${b} = ${r.MZN} MZN`, `1 ${b} = ${r.BRL} BRL`, `1 ${b} = ${r.ZAR} ZAR`]); };
def('dolar', '', cambio('USD')); def('euro', '', cambio('EUR'));

// ───── DONO ─────
const espalhar = so => async c => {
  if (!c.q) return c.r(['Cadê o texto?']);
  let g = Object.keys(await c.sock.groupFetchAllParticipating());
  if (so) g = g.filter(x => ler('alugados.json', []).includes(x));
  for (const j of g) { await c.sock.sendMessage(j, { text: moldura(['📢 ANÚNCIO', c.q]) }); await esp(1500); }
  c.r([`Enviado para ${g.length} grupos.`]);
};
def('broadcast', 'd', espalhar(false)); def('anuncio', 'd', espalhar(true));
def('ligar', 'd', async c => { c.cfg.ligado = true; salvar('config.json', c.cfg); c.r(['Despertei.']); });
def('desligar', 'd', async c => { c.cfg.ligado = false; salvar('config.json', c.cfg); c.r(['Adormeci. Só o dono me ouve.']); });
def('reiniciar', 'd', async c => { await c.r(['Reiniciando...']); process.exit(0); });
def('update', 'd', async c => { c.recarregar(); c.r([`Plugins recarregados: ${c.lista.length}`]); });
def('block', 'd', async c => { await c.sock.updateBlockStatus(c.alvos[0] || c.jid, 'block'); c.r(['Bloqueado.']); });
def('unblock', 'd', async c => { await c.sock.updateBlockStatus(c.alvos[0] || c.jid, 'unblock'); c.r(['Desbloqueado.']); });
def('entrar', 'd', async c => {
  const m = c.q.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/); if (!m) return c.r(['Mande o link do grupo.']);
  await c.sock.groupAcceptInvite(m[1]); c.r(['Entrei. Agora autorize com .aluguel add']);
});
def('listgp', 'd', async c => { const g = Object.values(await c.sock.groupFetchAllParticipating()); c.r(g.map((x, i) => `${i + 1}. ${x.subject} (${x.id})`)); });
def('setnome', 'd', async c => { await c.sock.updateProfileName(c.q); c.r(['Nome alterado.']); });
def('setbio', 'd', async c => { await c.sock.updateProfileStatus(c.q); c.r(['Bio alterada.']); });
def('dono', '', async c => c.r([`Dono: ${c.cfg.donoNome}`, c.cfg.contato]));

module.exports = A;
