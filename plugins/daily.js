// 🩸 Plugin .daily — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['daily'], cat: 'JOGOS',
  run: c => executar('fn', "daily", c)
};
