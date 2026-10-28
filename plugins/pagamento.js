// 🩸 Plugin .pagamento — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['pagamento'], cat: 'VENDAS',
  run: c => executar('cfg', "pagamento", c)
};
