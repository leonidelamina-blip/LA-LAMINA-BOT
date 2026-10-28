// Teste grátis de 1 dia (só no PV) + anúncio automático a cada 7 comandos
const { ler, salvar } = require('../lib/util');
const DIA = 86400000;
const livre = jid => {
  const f = ler('free.json', {}); if (!f[jid]) return false;
  if (Date.now() - f[jid] < DIA) return true;
  delete f[jid]; salvar('free.json', f); return false; // expirou
};
module.exports = {
  cmd: ['gratis'], cat: 'DONO', livre,
  async run(c) {
    if (c.isGroup) return c.r(['O teste grátis é só no PV. Desapareça.']);
    if (livre(c.jid)) return c.r(['Você já está no modo GRÁTIS.', 'Não abuse da minha paciência.']);
    const f = ler('free.json', {}), n = ler('count.json', {});
    f[c.jid] = Date.now(); n[c.jid] = 0; salvar('free.json', f); salvar('count.json', n);
    c.r(['Modo GRÁTIS ativado por 1 dia 🩸', 'Use o meu poder... enquanto durar.']);
  },
  async aposComando(c) {
    if (c.isGroup || c.cmd === 'gratis' || !livre(c.jid)) return;
    const n = ler('count.json', {}); n[c.jid] = (n[c.jid] || 0) + 1;
    if (n[c.jid] >= 7) {
      n[c.jid] = 0;
      await c.r(['Você está no modo GRÁTIS', `Entre no canal: ${c.cfg.canal}`, 'Digite .pagamento']);
    }
    salvar('count.json', n);
  }
};
