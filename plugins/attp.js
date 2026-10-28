// 🩸 Plugin .attp — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['attp'], cat: 'FIGURINHAS',
  run: c => executar('fn', "attp", c)
};
