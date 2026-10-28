// 🩸 Plugin .play2 — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['play2'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"play2","k":"v"}, c)
};
