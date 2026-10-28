// 🩸 Plugin .dalle — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['dalle'], cat: 'IA',
  run: c => executar('ia', {"img":1}, c)
};
