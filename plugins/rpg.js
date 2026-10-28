// 🩸 Plugin .rpg — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['rpg'], cat: 'JOGOS',
  run: c => executar('fn', "rpg", c)
};
