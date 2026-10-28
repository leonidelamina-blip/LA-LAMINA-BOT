// 🩸 Plugin .decode64 — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['decode64'], cat: 'UTILIDADES',
  run: c => executar('fn', "decode64", c)
};
