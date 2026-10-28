// 🩸 Plugin .madara — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['madara'], cat: 'ANIME',
  run: c => executar('txt', ["Madara Uchiha — lenda do clã.","Quem busca poder sem ódio é fraco."], c)
};
