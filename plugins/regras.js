// 🩸 Plugin .regras — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['regras'], cat: 'GRUPO',
  run: c => executar('fn', "regras", c)
};
