// 🩸 Plugin .level — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['level'], cat: 'JOGOS',
  run: c => executar('fn', "level", c)
};
