// 🩸 Plugin .mpesa — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['mpesa'], cat: 'VENDAS',
  run: c => executar('cfg', "mpesa", c)
};
