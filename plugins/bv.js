// Boas-vindas com foto de perfil — .bv on / .bv off (só ADM)
const { ler, salvar, moldura } = require('../lib/util');
const id = p => (typeof p === 'string' ? p : p.id);
const num = x => String(x).split('@')[0].split(':')[0];
module.exports = {
  cmd: ['bv'], cat: 'ADM',
  async run(c) {
    if (!c.isGroup) return c.r(['Isso só funciona em grupo. Desapareça.']);
    if (!c.isAdm && !c.isDono) return c.r(['Só ADM comanda aqui. Você é fraco.']);
    const op = (c.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(op)) return c.r(['Use: .bv on / .bv off']);
    const bv = ler('bv.json', {}); bv[c.jid] = op === 'on'; salvar('bv.json', bv);
    c.r([`Boas-vindas ${op === 'on' ? 'ATIVADAS 🩸' : 'DESATIVADAS 🌑'}`]);
  },
  // Quando alguém entra no grupo
  async onParticipants(sock, u) {
    if (u.action !== 'add' || !ler('bv.json', {})[u.id]) return;
    for (const p of u.participants.map(id)) {
      if (num(p) === num(sock.user.id)) continue;
      const legenda = moldura([`Olá @${num(p)}`, 'Bem-vindo(a) ao L LAMINA SOMBRIO V20', 'Tabela: digite .tabela', 'Pagamento: digite .pagamento', 'Que seu ódio te fortaleça']);
      let foto; try { foto = await sock.profilePictureUrl(p, 'image'); } catch {}
      await sock.sendMessage(u.id, foto ? { image: { url: foto }, caption: legenda, mentions: [p] } : { text: legenda, mentions: [p] });
    }
  }
};
