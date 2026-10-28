// 🩸 Plugin .revogar — ADM
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['revogar'], cat: 'ADM',
  run: c => executar('fn', "revogar", c)
};
