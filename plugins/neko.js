// 🩸 Plugin .neko — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['neko'], cat: 'ANIME',
  run: c => executar('web', {"img":1,"p":"url","u":"https://api.waifu.pics/sfw/neko"}, c)
};
