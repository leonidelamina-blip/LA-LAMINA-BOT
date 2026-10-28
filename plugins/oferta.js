// 🩸 Plugin .oferta — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['oferta'], cat: 'VENDAS',
  run: c => executar('cfg', "oferta", c)
};
