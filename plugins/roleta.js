// 🩸 Plugin .roleta — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['roleta'], cat: 'JOGOS',
  run: c => executar('fn', "roleta", c)
};
