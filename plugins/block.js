// 🩸 Plugin .block — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['block'], cat: 'DONO',
  run: c => executar('fn', "block", c)
};
