// 🩸 Plugin .brat — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['brat'], cat: 'FIGURINHAS',
  run: c => executar('fn', "brat", c)
};
