// 🩸 Plugin .lembrete — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['lembrete'], cat: 'UTILIDADES',
  run: c => executar('fn', "lembrete", c)
};
