// 🩸 Plugin .gpt — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['gpt'], cat: 'IA',
  run: c => executar('ia', "", c)
};
