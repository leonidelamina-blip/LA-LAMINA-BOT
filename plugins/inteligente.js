// 🩸 Plugin .inteligente — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['inteligente'], cat: 'DIVERSAO',
  run: c => executar('pct', "de inteligência 🧠", c)
};
