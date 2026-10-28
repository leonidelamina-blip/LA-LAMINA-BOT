// 🩸 Plugin .waifu — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['waifu'], cat: 'ANIME',
  run: c => executar('web', {"img":1,"p":"url","u":"https://api.waifu.pics/sfw/waifu"}, c)
};
