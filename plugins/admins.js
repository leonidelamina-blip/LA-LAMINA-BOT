// 🩸 Plugin .admins — GRUPO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['admins'], cat: 'GRUPO',
  run: c => executar('fn', "admins", c)
};
