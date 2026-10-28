// 🩸 Plugin .reiniciar — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['reiniciar'], cat: 'DONO',
  run: c => executar('fn', "reiniciar", c)
};
