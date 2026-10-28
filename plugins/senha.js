// 🩸 Plugin .senha — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['senha'], cat: 'UTILIDADES',
  run: c => executar('fn', "senha", c)
};
