// 🩸 Plugin .ttp — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ttp'], cat: 'FIGURINHAS',
  run: c => executar('fn', "ttp", c)
};
