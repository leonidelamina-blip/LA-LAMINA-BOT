// 🩸 Plugin .itachi — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['itachi'], cat: 'ANIME',
  run: c => executar('txt', ["Itachi Uchiha — meu irmão.","Carregou o ódio por mim. Entendi tarde demais."], c)
};
