// 🩸 Plugin .letra — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['letra'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"letra","k":"t"}, c)
};
