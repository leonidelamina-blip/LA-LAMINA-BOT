// 🩸 Plugin .pinterest — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['pinterest'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"pinterest","k":"i"}, c)
};
