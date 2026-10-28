// 🩸 Plugin .link — ADM
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['link'], cat: 'ADM',
  run: c => executar('fn', "link", c)
};
