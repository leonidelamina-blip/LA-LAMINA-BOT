// 🩸 Plugin .horario — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['horario'], cat: 'UTILIDADES',
  run: c => executar('fn', "horario", c)
};
