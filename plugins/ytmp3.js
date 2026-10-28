// 🩸 Plugin .ytmp3 — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ytmp3'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"ytmp3","k":"a"}, c)
};
