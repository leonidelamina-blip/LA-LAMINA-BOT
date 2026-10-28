// 🩸 Plugin .chute — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['chute'], cat: 'DIVERSAO',
  run: c => executar('acao', "chutou", c)
};
