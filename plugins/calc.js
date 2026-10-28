// 🩸 Plugin .calc — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['calc'], cat: 'UTILIDADES',
  run: c => executar('fn', "calc", c)
};
