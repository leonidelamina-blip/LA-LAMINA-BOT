// 🩸 Plugin .ytmp4 — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ytmp4'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"ytmp4","k":"v"}, c)
};
