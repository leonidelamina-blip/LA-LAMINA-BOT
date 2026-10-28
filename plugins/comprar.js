// 🩸 Plugin .comprar — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['comprar'], cat: 'VENDAS',
  run: c => executar('cfg', "comprar", c)
};
