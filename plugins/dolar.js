// 🩸 Plugin .dolar — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['dolar'], cat: 'UTILIDADES',
  run: c => executar('fn', "dolar", c)
};
