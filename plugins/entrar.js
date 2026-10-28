// 🩸 Plugin .entrar — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['entrar'], cat: 'DONO',
  run: c => executar('fn', "entrar", c)
};
