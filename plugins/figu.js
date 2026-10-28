// 🩸 Plugin .figu — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['figu'], cat: 'FIGURINHAS',
  run: c => executar('fn', "figu", c)
};
