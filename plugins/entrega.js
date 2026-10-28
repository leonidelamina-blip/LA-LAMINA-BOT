// 🩸 Plugin .entrega — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['entrega'], cat: 'VENDAS',
  run: c => executar('cfg', "entrega", c)
};
