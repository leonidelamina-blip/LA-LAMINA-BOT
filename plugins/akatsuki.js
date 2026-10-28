// 🩸 Plugin .akatsuki — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['akatsuki'], cat: 'ANIME',
  run: c => executar('txt', ["Nuvens vermelhas. Criminosos de rank S.","Fracos demais para me deter."], c)
};
