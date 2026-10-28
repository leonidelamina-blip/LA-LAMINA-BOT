// 🩸 Plugin .ligar — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ligar'], cat: 'DONO',
  run: c => executar('fn', "ligar", c)
};
