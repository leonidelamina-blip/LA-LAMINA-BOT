// 🩸 Plugin .conselho-ia — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['conselho-ia'], cat: 'IA',
  run: c => executar('ia', "Dê um conselho sobre: ", c)
};
