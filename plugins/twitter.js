// 🩸 Plugin .twitter — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['twitter'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"twitter","k":"v"}, c)
};
