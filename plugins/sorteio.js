// 🩸 Plugin .sorteio — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['sorteio'], cat: 'GRUPO',
  run: c => executar('fn', "sorteio", c)
};
