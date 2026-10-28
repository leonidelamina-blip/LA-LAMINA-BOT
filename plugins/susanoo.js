// 🩸 Plugin .susanoo — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['susanoo'], cat: 'ANIME',
  run: c => executar('txt', ["Susanoo — guerreiro de chakra roxo.","Defesa absoluta. Ataque inevitável."], c)
};
