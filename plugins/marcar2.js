// 🩸 Plugin .marcar2 — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['marcar2'], cat: 'GRUPO',
  run: c => executar('fn', "marcar2", c)
};
