// Sistema de aluguel / anti-grupo — usa ./alugados.json
const { ler, salvar, moldura } = require('../lib/util');
const id = p => (typeof p === 'string' ? p : p.id);
const num = x => String(x).split('@')[0].split(':')[0];
const avisados = new Set();
const negado = cfg => moldura([
  'ESSE GRUPO NÃO TEM ALUGUEL ATIVO ❌',
  'Vocês ousaram invocar o Uchiha sem permissão...',
  `Contate meu dono: ${cfg.contato}`,
  `Canal: ${cfg.canal}`,
  '"Vocês são fracos... me dão nojo." - Sasuke'
]);
// Bot entrou em grupo sem aluguel: avisa e sai em 10 segundos
async function checar(sock, gid) {
  if (ler('alugados.json', []).includes(gid) || avisados.has(gid)) return;
  avisados.add(gid); setTimeout(() => avisados.delete(gid), 60000);
  await sock.sendMessage(gid, { text: negado(ler('config.json', {})) });
  setTimeout(() => sock.groupLeave(gid).catch(() => {}), 10000);
}
module.exports = {
  cmd: ['aluguel'], cat: 'ADM', negado,
  async run(c) {
    if (!c.isDono) return c.r(['Só o meu dono pode usar isso. Desapareça.']);
    const sub = (c.args[0] || '').toLowerCase(), lista = ler('alugados.json', []);
    if (sub === 'add' || sub === 'del') {
      const gid = c.args[1] || c.jid;
      if (!gid.endsWith('@g.us')) return c.r(['Use dentro do grupo (ou passe o ID do grupo).']);
      salvar('alugados.json', sub === 'add' ? [...new Set([...lista, gid])] : lista.filter(x => x !== gid));
      return c.r([sub === 'add' ? 'Grupo AUTORIZADO 🩸 Use bem o meu poder.' : 'Aluguel REMOVIDO 🌑 Esse grupo não me merece mais.']);
    }
    if (sub === 'lista') {
      const nomes = await Promise.all(lista.map(async g => { try { return (await c.sock.groupMetadata(g)).subject; } catch { return g; } }));
      return c.r(nomes.length ? nomes.map((n, i) => `${i + 1}. ${n}`) : ['Nenhum grupo autorizado.']);
    }
    c.r(['Use: .aluguel add | del | lista']);
  },
  async onParticipants(sock, u) {
    if (u.action === 'add' && u.participants.map(id).some(p => num(p) === num(sock.user.id))) await checar(sock, u.id);
  },
  async onGrupo(sock, g) { await checar(sock, g.id); }
};
