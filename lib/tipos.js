// Executor dos tipos de comando: txt, cfg, rnd, pct, acao, alias, fn, web, dl, ia
const { pick, http, achaUrl, achaTxt, imagemIA } = require('./util');
const ACOES = require('./acoes');
const dig = (o, p) => p.split('.').reduce((x, k) => x?.[k], o);
const pedir = c => c.r(['Fale o que quer. Não adivinho. Desapareça.']);

const TIPOS = {
  txt: (a, c) => c.r(a),
  cfg: (a, c) => c.r(c.cfg.vendas?.[a] || [`Nada configurado. Edite config.json → vendas.${a}`]),
  rnd: (a, c) => c.r([pick(a)]),
  pct: (a, c) => { const n = c.alvos[0] || c.sender; return c.r([`@${c.num(n)} é ${Math.floor(Math.random() * 101)}% ${a}`], { mentions: [n] }); },
  acao: (a, c) => { const n = c.alvos[0]; if (!n) return c.r(['Marque o alvo.']); return c.r([`@${c.num(c.sender)} ${a} @${c.num(n)}`], { mentions: [c.sender, n] }); },
  alias: (a, c) => c.plugins.get(a).run(c),
  // Ações com lógica própria (lib/acoes.js) + checagem de permissão
  fn: (a, c) => {
    const x = ACOES[a];
    if (x.m && x.m !== 'd' && !c.isGroup) return c.r(['Só funciona em grupo. Desapareça.']);
    if (x.m === 'a' && !(c.isAdm || c.isDono)) return c.r(['Só ADM. Você é fraco.']);
    if (x.m === 'd' && !c.isDono) return c.r(['Só o meu dono. Desapareça.']);
    if (x.bot && !c.isBotAdm) return c.r(['Me dê ADM primeiro, ou não me incomode.']);
    return x.f(c);
  },
  // Consulta a uma API pública (texto, template ou imagem)
  web: async (a, c) => {
    if (a.q && !c.q) return pedir(c);
    const q = encodeURIComponent(a.mix ? c.q.replace(/[+\s]+/, '_') : c.q);
    const u = a.u.replace('{q}', q);
    if (a.dir) return c.sock.sendMessage(c.jid, { image: { url: u } }, { quoted: c.msg });
    const d = (await http(u)).data;
    if (a.img) return c.sock.sendMessage(c.jid, { image: { url: dig(d, a.p) || achaUrl(d) } }, { quoted: c.msg });
    const v = a.tpl ? a.tpl.replace(/\{([^}]+)\}/g, (_, k) => dig(d, k) ?? '?') : a.p ? dig(d, a.p) : d;
    return c.r([typeof v === 'string' ? v : JSON.stringify(v)]);
  },
  // Download por API de terceiros (config.json → apis.dl)
  dl: async (a, c) => {
    if (!c.q) return pedir(c);
    const e = encodeURIComponent(c.q);
    const d = (await http(`${c.cfg.apis.dl}${a.p}?url=${e}&q=${e}&query=${e}`)).data;
    if (a.k === 't') return c.r([achaTxt(d) || 'Nada encontrado.']);
    const u = achaUrl(d);
    if (!u) return c.r(['Nada encontrado... até o Sharingan falhou.']);
    const env = { a: { audio: { url: u }, mimetype: 'audio/mpeg' }, v: { video: { url: u } }, i: { image: { url: u } }, d: { document: { url: u }, mimetype: 'application/octet-stream', fileName: 'arquivo' } }[a.k];
    return c.sock.sendMessage(c.jid, env, { quoted: c.msg });
  },
  // IA (texto ou imagem) via config.json → apis.ia / apis.img
  ia: async (a, c) => {
    if (!c.q) return pedir(c);
    if (a.img) return c.sock.sendMessage(c.jid, { image: await imagemIA(c) }, { quoted: c.msg });
    const d = (await http(c.cfg.apis.ia + encodeURIComponent(a + c.q))).data;
    return c.r([achaTxt(d) || 'O silêncio também é uma resposta.']);
  }
};
module.exports = { executar: (t, a, c) => TIPOS[t](a, c) };
