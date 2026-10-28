// 🩸 Plugin .fb — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['fb'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"fb","k":"v"}, c)
};
