// 🩸 Plugin .pergunte — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['pergunte'], cat: 'IA',
  run: c => executar('ia', "", c)
};
