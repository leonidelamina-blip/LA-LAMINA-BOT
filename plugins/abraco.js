// 🩸 Plugin .abraco — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['abraco'], cat: 'DIVERSAO',
  run: c => executar('acao', "abraçou", c)
};
