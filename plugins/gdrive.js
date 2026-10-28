// 🩸 Plugin .gdrive — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['gdrive'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"gdrive","k":"d"}, c)
};
