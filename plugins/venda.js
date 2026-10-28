// 🩸 Plugin .venda — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['venda'], cat: 'VENDAS',
  run: c => executar('cfg', "venda", c)
};
