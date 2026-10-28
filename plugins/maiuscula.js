// 🩸 Plugin .maiuscula — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['maiuscula'], cat: 'UTILIDADES',
  run: c => executar('fn', "maiuscula", c)
};
