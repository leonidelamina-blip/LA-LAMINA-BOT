// 🩸 Plugin .uptime — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['uptime'], cat: 'UTILIDADES',
  run: c => executar('fn', "uptime", c)
};
