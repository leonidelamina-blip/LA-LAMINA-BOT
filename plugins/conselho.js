// 🩸 Plugin .conselho — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['conselho'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Durma cedo.","Pague suas dívidas.","Treine mesmo sem vontade."], c)
};
