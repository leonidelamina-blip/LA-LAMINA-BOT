// 🩸 Plugin .konoha — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['konoha'], cat: 'ANIME',
  run: c => executar('txt', ["Konoha — a vila escondida entre as folhas.","Apodrecida por dentro."], c)
};
