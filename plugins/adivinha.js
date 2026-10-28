// 🩸 Plugin .adivinha — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['adivinha'], cat: 'JOGOS',
  run: c => executar('fn', "adivinha", c)
};
