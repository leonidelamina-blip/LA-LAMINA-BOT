// 🩸 Plugin .enquete — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['enquete'], cat: 'GRUPO',
  run: c => executar('fn', "enquete", c)
};
