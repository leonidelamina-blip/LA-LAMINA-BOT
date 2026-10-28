// 🩸 Plugin .moeda — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['moeda'], cat: 'JOGOS',
  run: c => executar('fn', "moeda", c)
};
