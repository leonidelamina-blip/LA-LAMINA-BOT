// 🩸 Plugin .chidori — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['chidori'], cat: 'ANIME',
  run: c => executar('txt', ["⚡ Chidori — mil pássaros gritando.","Perfura tudo que é fraco."], c)
};
