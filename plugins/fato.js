// 🩸 Plugin .fato — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['fato'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["O polvo tem três corações.","O mel nunca estraga.","Formigas não dormem."], c)
};
