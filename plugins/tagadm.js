// 🩸 Plugin .tagadm — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['tagadm'], cat: 'GRUPO',
  run: c => executar('fn', "tagadm", c)
};
