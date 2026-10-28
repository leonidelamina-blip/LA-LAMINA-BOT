// 🩸 Plugin .s — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['s'], cat: 'FIGURINHAS',
  run: c => executar('fn', "s", c)
};
