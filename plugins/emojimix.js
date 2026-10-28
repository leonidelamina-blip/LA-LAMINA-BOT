// 🩸 Plugin .emojimix — FIGURINHAS
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['emojimix'], cat: 'FIGURINHAS',
  run: c => executar('web', {"q":1,"mix":1,"img":1,"p":"results.0.media_formats.png_transparent.url","u":"https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q={q}"}, c)
};
