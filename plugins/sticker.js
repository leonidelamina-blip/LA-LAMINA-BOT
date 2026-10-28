// 🩸 Plugin .sticker — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['sticker'], cat: 'FIGURINHAS',
  run: c => executar('fn', "sticker", c)
};
