// 🩸 Plugin .desligar — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['desligar'], cat: 'DONO',
  run: c => executar('fn', "desligar", c)
};
