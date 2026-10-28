// 🩸 Plugin .dado — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['dado'], cat: 'JOGOS',
  run: c => executar('fn', "dado", c)
};
