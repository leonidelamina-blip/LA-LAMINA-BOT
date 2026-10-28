// 🩸 Plugin .pix — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['pix'], cat: 'VENDAS',
  run: c => executar('cfg', "pix", c)
};
