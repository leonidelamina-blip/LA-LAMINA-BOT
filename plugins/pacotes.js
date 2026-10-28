// 🩸 Plugin .pacotes — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['pacotes'], cat: 'VENDAS',
  run: c => executar('cfg', "pacotes", c)
};
