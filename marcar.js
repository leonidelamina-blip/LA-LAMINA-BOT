// 🩸 Plugin .marcar — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['marcar'], cat: 'GRUPO',
  run: c => executar('fn', "marcar", c)
};
