// 🩸 Plugin .base64 — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['base64'], cat: 'UTILIDADES',
  run: c => executar('fn', "base64", c)
};
