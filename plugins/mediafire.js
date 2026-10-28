// 🩸 Plugin .mediafire — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['mediafire'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"mediafire","k":"d"}, c)
};
