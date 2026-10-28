// 🩸 Plugin .sasuke — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['sasuke'], cat: 'ANIME',
  run: c => executar('txt', ["Sasuke Uchiha — último herdeiro do clã.","Meu ódio é mais profundo que o seu."], c)
};
