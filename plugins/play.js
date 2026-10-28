// 🩸 Plugin .play — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['play'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"play","k":"a"}, c)
};
