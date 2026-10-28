// 🩸 Plugin .par — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['par'], cat: 'DIVERSAO',
  run: c => executar('fn', "par", c)
};
