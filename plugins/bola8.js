// 🩸 Plugin .bola8 — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['bola8'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Sim.","Não.","Talvez... não me importa.","Desapareça e pergunte de novo."], c)
};
