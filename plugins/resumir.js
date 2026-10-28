// 🩸 Plugin .resumir — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['resumir'], cat: 'IA',
  run: c => executar('ia', "Resuma em português: ", c)
};
