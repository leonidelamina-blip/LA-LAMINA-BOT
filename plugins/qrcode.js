// 🩸 Plugin .qrcode — UTILIDADES
const { executar } = require('../lib/tipos');
module.exports = {
  cmd: ['qrcode'], cat: 'UTILIDADES',
  run: c => executar('web', {"q":1,"dir":1,"u":"https://api.qrserver.com/v1/create-qr-code/?size=500x500&data={q}"}, c)
};
