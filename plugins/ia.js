// 🩸 Plugin .ia — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ia'], cat: 'IA',
  run: c => executar('ia', "Responda como Sasuke Uchiha, frio e seco, em português: ", c)
};
