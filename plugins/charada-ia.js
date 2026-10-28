// 🩸 Plugin .charada-ia — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['charada-ia'], cat: 'IA',
  run: c => executar('ia', "Crie uma charada sobre: ", c)
};
