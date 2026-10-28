// 🩸 Plugin .curiosidade — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['curiosidade'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["O coração do camarão fica na cabeça.","Os polvos têm sangue azul.","Bananas são levemente radioativas."], c)
};
