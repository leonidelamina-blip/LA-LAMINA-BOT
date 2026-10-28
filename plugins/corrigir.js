// 🩸 Plugin .corrigir — IA
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['corrigir'], cat: 'IA',
  run: c => executar('ia', "Corrija o texto: ", c)
};
