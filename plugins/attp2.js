// 🩸 Plugin .attp2 — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['attp2'], cat: 'FIGURINHAS',
  run: c => executar('fn', "attp2", c)
};
