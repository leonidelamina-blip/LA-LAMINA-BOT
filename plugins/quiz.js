// 🩸 Plugin .quiz — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['quiz'], cat: 'JOGOS',
  run: c => executar('fn', "quiz", c)
};
