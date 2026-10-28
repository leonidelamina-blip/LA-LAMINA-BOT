// 🩸 Plugin .soundcloud — DOWNLOAD
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['soundcloud'], cat: 'DOWNLOAD',
  run: c => executar('dl', {"p":"soundcloud","k":"a"}, c)
};
