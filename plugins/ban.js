// 🩸 Plugin .ban — ADM
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['ban'], cat: 'ADM',
  run: c => executar('fn', "ban", c)
};
