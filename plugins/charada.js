// 🩸 Plugin .charada — DIVERSAO
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['charada'], cat: 'DIVERSAO',
  run: c => executar('rnd', ["O que é, o que é? Cai em pé e corre deitado. (Chuva)","O que é, o que é? Quanto mais se tira, maior fica. (Buraco)","O que é, o que é? Tem dentes mas não morde. (Pente)"], c)
};
