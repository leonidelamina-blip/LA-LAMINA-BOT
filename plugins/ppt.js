// 🩸 Plugin .ppt — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ppt'], cat: 'JOGOS',
  run: c => executar('fn', "ppt", c)
};
