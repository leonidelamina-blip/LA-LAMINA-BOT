// 🩸 Plugin .promover — ADM
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['promover'], cat: 'ADM',
  run: c => executar('fn', "promover", c)
};
