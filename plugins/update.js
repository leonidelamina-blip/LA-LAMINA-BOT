// 🩸 Plugin .update — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['update'], cat: 'DONO',
  run: c => executar('fn', "update", c)
};
