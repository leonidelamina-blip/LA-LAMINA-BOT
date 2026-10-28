// 🩸 Plugin .slot — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['slot'], cat: 'JOGOS',
  run: c => executar('fn', "slot", c)
};
