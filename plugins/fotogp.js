// 🩸 Plugin .fotogp — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['fotogp'], cat: 'GRUPO',
  run: c => executar('fn', "fotogp", c)
};
