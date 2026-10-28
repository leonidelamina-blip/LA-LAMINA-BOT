// 🩸 Plugin .rank — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['rank'], cat: 'JOGOS',
  run: c => executar('fn', "rank", c)
};
