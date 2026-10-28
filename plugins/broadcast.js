// 🩸 Plugin .broadcast — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['broadcast'], cat: 'DONO',
  run: c => executar('fn', "broadcast", c)
};
