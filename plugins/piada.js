// 🩸 Plugin .piada — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['piada'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Por que o Sasuke não faz amigos? Só aceita rivais.","Chidori fraco é como piada ruim: não perfura ninguém.","Qual o ninja mais educado? O que pede licença antes de sumir."], c)
};
