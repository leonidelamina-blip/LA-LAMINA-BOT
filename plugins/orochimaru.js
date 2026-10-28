// 🩸 Plugin .orochimaru — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['orochimaru'], cat: 'ANIME',
  run: c => executar('txt', ["🐍 Orochimaru — o sannin das serpentes.","Me ensinou poder. Eu o consumi."], c)
};
