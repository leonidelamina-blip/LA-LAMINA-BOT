// .antilink on/off — apaga e remove quem mandar link de grupo (bot precisa ser ADM)
const { ler, salvar } = require('../lib/util');
module.exports = {
  cmd: ['antilink'], cat: 'GRUPO',
  async run(c) {
    if (!c.isGroup) return c.r(['Só em grupo.']);
    if (!c.isAdm && !c.isDono) return c.r(['Só ADM. Você é fraco.']);
    const op = (c.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(op)) return c.r(['Use: .antilink on / .antilink off']);
    const g = ler('grupos.json', {}); g[c.jid] ||= {}; g[c.jid].antilink = op === 'on'; salvar('grupos.json', g);
    c.r([`Antilink ${op === 'on' ? 'ATIVADO 🐍' : 'DESATIVADO 🌑'}`]);
  },
  async onMessage(c) {
    if (!c.isGroup || c.isAdm || c.isDono || !c.isBotAdm) return;
    if (!ler('grupos.json', {})[c.jid]?.antilink) return;
    if (!/chat\.whatsapp\.com\/[A-Za-z0-9]+/i.test(c.texto)) return;
    await c.sock.sendMessage(c.jid, { delete: c.msg.key });
    await c.sock.groupParticipantsUpdate(c.jid, [c.sender], 'remove');
    c.r([`@${c.num(c.sender)} mandou link. Eliminado.`], { mentions: [c.sender] });
  }
};
