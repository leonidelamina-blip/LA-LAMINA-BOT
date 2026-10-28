// 🩸 Plugin .setbio — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['setbio'], cat: 'DONO',
  run: c => executar('fn', "setbio", c)
};
