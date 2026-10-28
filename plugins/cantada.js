// 🩸 Plugin .cantada — +18
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['cantada'], cat: '+18',
  run: c => executar('rnd', ["⚠️ +18 — só maiores de idade.\nVocê tem fogo? Meu Amaterasu acendeu...","⚠️ +18 — só maiores de idade.\nSeu olhar hipnotiza mais que o meu Sharingan.","⚠️ +18 — só maiores de idade.\nSeu nome é Wi-Fi? Senti conexão."], c)
};
