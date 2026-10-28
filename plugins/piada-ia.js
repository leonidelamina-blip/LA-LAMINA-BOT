// 🩸 Plugin .piada-ia — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['piada-ia'], cat: 'IA',
  run: c => executar('ia', "Conte uma piada sobre: ", c)
};
