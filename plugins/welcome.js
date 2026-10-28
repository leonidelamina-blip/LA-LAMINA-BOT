// 🩸 Plugin .welcome — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['welcome'], cat: 'GRUPO',
  run: c => executar('alias', "bv", c)
};
