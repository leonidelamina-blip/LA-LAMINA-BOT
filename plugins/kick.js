// 🩸 Plugin .kick — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['kick'], cat: 'GRUPO',
  run: c => executar('fn', "kick", c)
};
