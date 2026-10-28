// 🩸 Plugin .wiki — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['wiki'], cat: 'UTILIDADES',
  run: c => executar('web', {"q":1,"p":"extract","u":"https://pt.wikipedia.org/api/rest_v1/page/summary/{q}"}, c)
};
