// 🩸 Plugin .id — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['id'], cat: 'UTILIDADES',
  run: c => executar('fn', "id", c)
};
