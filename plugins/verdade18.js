// 🩸 Plugin .verdade18 — +18
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['verdade18'], cat: '+18',
  run: c => executar('rnd', ["⚠️ +18 — só maiores de idade.\nQual foi o seu melhor beijo?","⚠️ +18 — só maiores de idade.\nJá ficou com alguém do grupo?","⚠️ +18 — só maiores de idade.\nQuem é o seu maior crush?"], c)
};
