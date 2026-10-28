// 🩸 Plugin .verdade — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['verdade'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Qual é o seu maior medo?","Quem você ignorou hoje?","Já mentiu para o grupo?"], c)
};
