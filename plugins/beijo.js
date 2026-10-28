// 🩸 Plugin .beijo — +18
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['beijo'], cat: '+18',
  run: c => executar('rnd', ["⚠️ +18 — só maiores de idade.\nUm beijo na testa. Não espere mais de mim.","⚠️ +18 — só maiores de idade.\nBeijo roubado 😘 Não conte a ninguém."], c)
};
