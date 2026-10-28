// 🩸 Plugin .setnome — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['setnome'], cat: 'DONO',
  run: c => executar('fn', "setnome", c)
};
