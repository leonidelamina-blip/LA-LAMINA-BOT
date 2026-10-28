// 🩸 Plugin .nomegp — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['nomegp'], cat: 'GRUPO',
  run: c => executar('fn', "nomegp", c)
};
