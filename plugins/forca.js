// 🩸 Plugin .forca — JOGOS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['forca'], cat: 'JOGOS',
  run: c => executar('fn', "forca", c)
};
