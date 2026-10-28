// 🩸 Plugin .descgp — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['descgp'], cat: 'GRUPO',
  run: c => executar('fn', "descgp", c)
};
