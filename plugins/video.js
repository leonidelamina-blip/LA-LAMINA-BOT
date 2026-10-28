// 🩸 Plugin .video — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['video'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"video","k":"v"}, c)
};
