// 🩸 Plugin .likee — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['likee'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"likee","k":"v"}, c)
};
