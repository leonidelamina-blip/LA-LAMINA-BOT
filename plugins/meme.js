// 🩸 Plugin .meme — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['meme'], cat: 'DIVERSAO',
  run: c => executar('web', {"img":1,"p":"url","u":"https://meme-api.com/gimme"}, c)
};
