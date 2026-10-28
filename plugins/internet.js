// 🩸 Plugin .internet — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['internet'], cat: 'VENDAS',
  run: c => executar('cfg', "internet", c)
};
