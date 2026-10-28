// 🩸 Plugin .stock — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['stock'], cat: 'VENDAS',
  run: c => executar('cfg', "stock", c)
};
