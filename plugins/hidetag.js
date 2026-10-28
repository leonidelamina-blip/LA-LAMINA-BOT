// 🩸 Plugin .hidetag — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['hidetag'], cat: 'GRUPO',
  run: c => executar('fn', "hidetag", c)
};
