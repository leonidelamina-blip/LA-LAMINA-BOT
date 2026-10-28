// 🩸 Plugin .anuncio — DONO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['anuncio'], cat: 'DONO',
  run: c => executar('fn', "anuncio", c)
};
