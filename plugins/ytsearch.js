// 🩸 Plugin .ytsearch — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ytsearch'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"ytsearch","k":"t"}, c)
};
