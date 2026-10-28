// 🩸 Plugin .kakashi — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['kakashi'], cat: 'ANIME',
  run: c => executar('txt', ["Kakashi Hatake — o ninja que copiou mil técnicas.","Meu antigo professor. Ainda o respeito."], c)
};
