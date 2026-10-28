// 🩸 Plugin .shinobi — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['shinobi'], cat: 'ANIME',
  run: c => executar('txt', ["Shinobi — quem suporta a dor e segue em frente.","Quem chora, perde."], c)
};
