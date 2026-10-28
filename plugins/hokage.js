// 🩸 Plugin .hokage — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['hokage'], cat: 'ANIME',
  run: c => executar('txt', ["Hokage — título de quem protege a vila.","Eu prefiro fazê-la tremer."], c)
};
