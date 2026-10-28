// 🩸 Plugin .listgp — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['listgp'], cat: 'DONO',
  run: c => executar('fn', "listgp", c)
};
