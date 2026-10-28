// 🩸 Plugin .perfil — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['perfil'], cat: 'JOGOS',
  run: c => executar('fn', "perfil", c)
};
