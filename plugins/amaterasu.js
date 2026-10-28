// 🩸 Plugin .amaterasu — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['amaterasu'], cat: 'ANIME',
  run: c => executar('txt', ["🔥 Amaterasu — chamas negras que nunca se apagam.","Queimam até o desprezo."], c)
};
