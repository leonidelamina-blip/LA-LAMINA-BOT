// 🩸 Plugin .apagar — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['apagar'], cat: 'GRUPO',
  run: c => executar('fn', "apagar", c)
};
