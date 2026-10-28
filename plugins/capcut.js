// 🩸 Plugin .capcut — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['capcut'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"capcut","k":"v"}, c)
};
