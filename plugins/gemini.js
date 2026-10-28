// 🩸 Plugin .gemini — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['gemini'], cat: 'IA',
  run: c => executar('ia', "", c)
};
