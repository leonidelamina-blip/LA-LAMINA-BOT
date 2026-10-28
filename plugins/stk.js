// 🩸 Plugin .stk — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['stk'], cat: 'FIGURINHAS',
  run: c => executar('fn', "stk", c)
};
