// 🩸 Plugin .precos — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['precos'], cat: 'VENDAS',
  run: c => executar('cfg', "precos", c)
};
