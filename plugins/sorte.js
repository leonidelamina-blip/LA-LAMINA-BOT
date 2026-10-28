// 🩸 Plugin .sorte — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['sorte'], cat: 'JOGOS',
  run: c => executar('fn', "sorte", c)
};
