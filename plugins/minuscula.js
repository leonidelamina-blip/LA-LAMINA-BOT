// 🩸 Plugin .minuscula — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['minuscula'], cat: 'UTILIDADES',
  run: c => executar('fn', "minuscula", c)
};
