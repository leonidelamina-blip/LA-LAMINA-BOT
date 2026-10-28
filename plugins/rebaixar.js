// 🩸 Plugin .rebaixar — ADM
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['rebaixar'], cat: 'ADM',
  run: c => executar('fn', "rebaixar", c)
};
