// 🩸 Plugin .desafio — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['desafio'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Fique 10 min sem celular.","Mande um áudio cantando.","Elogie o último que falou."], c)
};
