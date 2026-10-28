// 🩸 Plugin .wm — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['wm'], cat: 'FIGURINHAS',
  run: c => executar('fn', "wm", c)
};
