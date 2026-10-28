// 🩸 Plugin .frase-sasuke — ANIME
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['frase-sasuke'], cat: 'ANIME',
  run: c => executar('rnd', ["Vocês são fracos... me dão nojo.","Meu ódio é mais profundo que o seu.","Desapareça.","Poder é tudo. O resto é ruído.","Não me chame de amigo."], c)
};
