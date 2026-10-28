// 🩸 Plugin .sorte-hoje — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['sorte-hoje'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Sorte: 20%.","Sorte: 70%.","Sorte: 99%. Aproveite."], c)
};
