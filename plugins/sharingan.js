// 🩸 Plugin .sharingan — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['sharingan'], cat: 'ANIME',
  run: c => executar('txt', ["👁️ Sharingan — o olho que copia, prevê e domina.","Nenhuma ilusão me engana."], c)
};
