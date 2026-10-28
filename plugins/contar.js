// 🩸 Plugin .contar — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['contar'], cat: 'UTILIDADES',
  run: c => executar('fn', "contar", c)
};
