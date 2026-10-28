const fs = require('fs');
const path = require('path');

module.exports = {
  name: "dono",
  alias: ["criador", "owner", "uchiha"],
  run: async (ctx) => {
    const { sock, remote } = ctx;
    const fotoPath = path.join(__dirname, '../media/dono.jpg');
    
    const info = `*🩸👁️ L LAMINA SOMBRIO V20 - MODO SASUKE 👁️🩸*

*┏━━━『 INFORMAÇÕES DO DONO 』━━━┓*
*┃*
*┃ 👤 Nome: Dono Leo - Uchiha*
*┃ 🩸 Clã: Uchiha Sombrio*
*┃ 👁️ Doujutsu: Sharingan*
*┃*
*┃ 📞 Número: wa.me/258852223969*
*┃ 🤖 Bot: 87 269 8781*
*┃ 🔥 Função: Desenvolvedor e ADM Supremo*
*┃*
*┃ 🌐 Link: https://wa.me/258852223969*
*┃ ⚡ Versão: V20 - 200 Comandos*
*┃ 🩸 Tema: Sangue & Escuridão*
*┃*
*┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛*

*⚠️ AVISO: Não provoque o Sharingan...*
*🔥 L LAMINA SOMBRIO V20 - SASUKE UCHIHA*`;

    try {
      if (fs.existsSync(fotoPath)) {
        await sock.sendMessage(remote, {
          image: fs.readFileSync(fotoPath),
          caption: info
        });
      } else {
        await sock.sendMessage(remote, { text: info });
      }
    } catch (e) {
      await sock.sendMessage(remote, { text: info });
    }
  }
}
