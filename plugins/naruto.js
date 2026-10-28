// 🩸 Plugin .naruto — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['naruto'], cat: 'ANIME',
  run: c => executar('txt', ["Naruto Uzumaki — o idiota que nunca desistiu.","O único rival que eu reconheço."], c)
};
