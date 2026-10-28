// 🩸 Plugin .wallpaper-anime — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['wallpaper-anime'], cat: 'ANIME',
  run: c => executar('web', {"img":1,"p":"url","u":"https://api.waifu.pics/sfw/waifu"}, c)
};
