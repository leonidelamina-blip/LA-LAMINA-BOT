// 🩸 Plugin .movitel — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['movitel'], cat: 'VENDAS',
  run: c => executar('cfg', "movitel", c)
};
