// 🩸 Plugin .promocao — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['promocao'], cat: 'VENDAS',
  run: c => executar('cfg', "promocao", c)
};
