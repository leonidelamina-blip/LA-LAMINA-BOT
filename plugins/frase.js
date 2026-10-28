// 🩸 Plugin .frase — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['frase'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["A dor te ensina.","Quem não suporta a solidão não suporta o poder.","Fraqueza é escolha."], c)
};
