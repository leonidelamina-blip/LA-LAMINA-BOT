// 🩸 Plugin .vodacom — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['vodacom'], cat: 'VENDAS',
  run: c => executar('cfg', "vodacom", c)
};
