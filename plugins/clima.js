// 🩸 Plugin .clima — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['clima'], cat: 'UTILIDADES',
  run: c => executar('web', {"q":1,"u":"https://wttr.in/{q}?format=3&lang=pt"}, c)
};
