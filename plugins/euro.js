// 🩸 Plugin .euro — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['euro'], cat: 'UTILIDADES',
  run: c => executar('fn', "euro", c)
};
