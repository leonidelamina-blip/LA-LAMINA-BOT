// 🩸 Plugin .membros — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['membros'], cat: 'GRUPO',
  run: c => executar('fn', "membros", c)
};
