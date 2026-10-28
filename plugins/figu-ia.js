// 🩸 Plugin .figu-ia — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['figu-ia'], cat: 'FIGURINHAS',
  run: c => executar('fn', "figu-ia", c)
};
