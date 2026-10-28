// 🩸 Plugin .namoro — +18
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['namoro'], cat: '+18',
  run: c => executar('rnd', ["⚠️ +18 — só maiores de idade.\nCombinam. Mas não me envolvam.","⚠️ +18 — só maiores de idade.\nDuram uma semana.","⚠️ +18 — só maiores de idade.\nCasal do ano 💘"], c)
};
