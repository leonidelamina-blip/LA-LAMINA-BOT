// 🩸 Plugin .imagine — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['imagine'], cat: 'IA',
  run: c => executar('ia', {"img":1}, c)
};
