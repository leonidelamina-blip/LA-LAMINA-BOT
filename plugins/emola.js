// 🩸 Plugin .emola — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['emola'], cat: 'VENDAS',
  run: c => executar('cfg', "emola", c)
};
