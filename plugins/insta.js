// 🩸 Plugin .insta — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['insta'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"insta","k":"v"}, c)
};
