// 🩸 Plugin .ilimitado — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ilimitado'], cat: 'VENDAS',
  run: c => executar('cfg', "ilimitado", c)
};
