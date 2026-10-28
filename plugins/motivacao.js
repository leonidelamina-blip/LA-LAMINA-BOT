// 🩸 Plugin .motivacao — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['motivacao'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["Levante. Treine. Repita.","A dor passa, o resultado fica.","Ninguém fará por você."], c)
};
