// 🩸 Plugin .desafio18 — +18
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['desafio18'], cat: '+18',
  run: c => executar('rnd', ["⚠️ +18 — só maiores de idade.\nMande um áudio sussurrando.","⚠️ +18 — só maiores de idade.\nConte o seu último date.","⚠️ +18 — só maiores de idade.\nEscolha alguém e faça um elogio."], c)
};
