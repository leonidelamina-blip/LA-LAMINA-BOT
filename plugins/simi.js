// 🩸 Plugin .simi — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['simi'], cat: 'IA',
  run: c => executar('ia', "Responda como um chatbot zoeiro: ", c)
};
