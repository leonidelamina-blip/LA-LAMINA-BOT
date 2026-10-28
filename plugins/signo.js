// 🩸 Plugin .signo — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['signo'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Hoje terá sorte... não abuse.","Evite discussões hoje.","Alguém vai te surpreender."], c)
};
