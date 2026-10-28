// 🩸 Plugin .cep — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['cep'], cat: 'UTILIDADES',
  run: c => executar('web', {"q":1,"u":"https://viacep.com.br/ws/{q}/json/","tpl":"{logradouro}, {bairro}\n{localidade}/{uf} — CEP {cep}"}, c)
};
