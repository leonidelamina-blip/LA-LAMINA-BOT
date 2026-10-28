// 🩸 Plugin .tabela — VENDAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['tabela'], cat: 'VENDAS',
  run: c => executar('cfg', "tabela", c)
};
