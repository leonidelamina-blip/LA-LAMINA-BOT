// 🩸 Plugin .preco — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['preco'], cat: 'VENDAS',
  run: c => executar('cfg', "preco", c)
};
