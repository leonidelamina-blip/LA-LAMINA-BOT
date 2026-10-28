// 🩸 Plugin .codigo — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['codigo'], cat: 'IA',
  run: c => executar('ia', "Escreva código para: ", c)
};
