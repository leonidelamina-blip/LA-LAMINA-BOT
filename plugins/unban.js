// 🩸 Plugin .unban — ADM
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['unban'], cat: 'ADM',
  run: c => executar('fn', "unban", c)
};
