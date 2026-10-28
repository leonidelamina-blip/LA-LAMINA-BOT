// 🩸 Plugin .add — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['add'], cat: 'GRUPO',
  run: c => executar('fn', "add", c)
};
