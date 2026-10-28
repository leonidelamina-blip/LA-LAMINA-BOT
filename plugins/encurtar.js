// 🩸 Plugin .encurtar — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['encurtar'], cat: 'UTILIDADES',
  run: c => executar('web', {"q":1,"u":"https://is.gd/create.php?format=simple&url={q}"}, c)
};
