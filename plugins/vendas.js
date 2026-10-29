// Comandos: .tabela .preco .pagamento .pagar .dono
module.exports = {
  cmd: ['tabela', 'preco', 'pagamento', 'pagar', 'dono'],

  async run({ cmd, cfg, r }) {
    const v = cfg.vendas || {};

    if (cmd === 'tabela' || cmd === 'preco') {
      if (!v.tabela) return r('⚠️ Tabela de preços não configurada.');
      return r(v.tabela);
    }

    if (cmd === 'pagamento' || cmd === 'pagar') {
      if (!v.pagamento) return r('⚠️ Dados de pagamento não configurados.');
      return r(v.pagamento);
    }

    if (cmd === 'dono') {
      return r([
        `👁️ Dono: ${cfg.donoNome || 'Dono'}`,
        cfg.contato ? `📞 Contato: ${cfg.contato}` : '',
        cfg.canal ? `📢 Canal: ${cfg.canal}` : ''
      ].filter(Boolean));
    }
  }
};
