// 🩸 Plugin .beleza — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['beleza'], cat: 'DIVERSAO',
  run: c => executar('pct', "de beleza ✨", c)
};
