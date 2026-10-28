// 🩸 Plugin .net — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['net'], cat: 'VENDAS',
  run: c => executar('cfg', "net", c)
};
