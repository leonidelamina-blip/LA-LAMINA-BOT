// 🩸 Plugin .f — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['f'], cat: 'FIGURINHAS',
  run: c => executar('fn', "f", c)
};
