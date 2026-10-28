// 🩸 Plugin .poema — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['poema'], cat: 'IA',
  run: c => executar('ia', "Escreva um poema sombrio sobre: ", c)
};
