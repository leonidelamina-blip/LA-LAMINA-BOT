// 🩸 Plugin .apk — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['apk'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"apk","k":"d"}, c)
};
