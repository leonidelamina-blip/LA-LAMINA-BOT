// 🩸 Plugin .tapa — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['tapa'], cat: 'DIVERSAO',
  run: c => executar('acao', "deu um tapa em", c)
};
