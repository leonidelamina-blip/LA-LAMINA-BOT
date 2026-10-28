// 🩸 Plugin .info-grupo — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['info-grupo'], cat: 'GRUPO',
  run: c => executar('fn', "info-grupo", c)
};
