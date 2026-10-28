// 🩸 Plugin .uchiha — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['uchiha'], cat: 'ANIME',
  run: c => executar('txt', ["Clã Uchiha — orgulho, poder e tragédia.","Restou pouco. Restou eu."], c)
};
