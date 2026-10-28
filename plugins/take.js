// 🩸 Plugin .take — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['take'], cat: 'FIGURINHAS',
  run: c => executar('fn', "take", c)
};
