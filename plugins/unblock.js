// 🩸 Plugin .unblock — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['unblock'], cat: 'DONO',
  run: c => executar('fn', "unblock", c)
};
