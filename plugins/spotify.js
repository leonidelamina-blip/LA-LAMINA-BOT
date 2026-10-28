// 🩸 Plugin .spotify — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['spotify'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"spotify","k":"a"}, c)
};
