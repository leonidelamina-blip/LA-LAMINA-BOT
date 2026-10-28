// 🩸 Plugin .sairgp — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['sairgp'], cat: 'GRUPO',
  run: c => executar('fn', "sairgp", c)
};
