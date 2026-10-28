// 🩸 Plugin .parimpar — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['parimpar'], cat: 'JOGOS',
  run: c => executar('fn', "parimpar", c)
};
