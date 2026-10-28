// 🩸 Plugin .ping — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ping'], cat: 'UTILIDADES',
  run: c => executar('fn', "ping", c)
};
