const fs = require('fs');
const path = './bv.json';
if (!fs.existsSync(path)) fs.writeFileSync(path, '{}');

module.exports = {
  name: "boas-vindas",
  alias: ["bv", "bem-vindo", "boasvindas", "welcome"],
  
  run: async (ctx) => {
    const { sock, remote, args, isGroup, isAdmin } = ctx;
    if (!isGroup) return;
    if (!isAdmin) return sock.sendMessage(remote, { text: `❌ Só ADM` });

    let db = JSON.parse(fs.readFileSync(path));
    let arg = (args[0] || '').toLowerCase();

    if (!arg) {
      return sock.sendMessage(remote, { text: 
`╭─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╮
│ ✧˚ ༘♡ 🩸 BOAS-VINDAS
│ ✧˚ ༘♡ 🩸 Status: ${db[remote] ? 'ATIVADO ✅' : 'DESATIVADO ❌'}
│ ✧˚ ༘♡ 🩸 Use: .bv on / .bv off
╰─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╯` });
    }

    if (arg === 'on') {
      db[remote] = true;
      fs.writeFileSync(path, JSON.stringify(db));
      return sock.sendMessage(remote, { text: 
`╭─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╮
│ ✧˚ ༘♡ 🩸 BOAS-VINDAS ATIVADO
│ ✧˚ ༘♡ 🩸 SHARINGAN ABERTO 👁️
╰─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╯` });
    }

    if (arg === 'off') {
      delete db[remote];
      fs.writeFileSync(path, JSON.stringify(db));
      return sock.sendMessage(remote, { text: 
`╭─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╮
│ ✧˚ ༘♡ 🩸 DESATIVADO 🌑
╰─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╯` });
    }
  },

  onGroupParticipantsUpdate: async (ctx) => {
    const { sock, remote, action, participants } = ctx;
    if (action !== 'add') return;
    let db = JSON.parse(fs.readFileSync(path));
    if (!db[remote]) return;

    for (let jid of participants) {
      let pp;
      try { pp = await sock.profilePictureUrl(jid, 'image'); }
      catch { pp = 'https://i.ibb.co/4YBN3P5/no-profile.jpg'; }

      let legenda = 
`╭─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╮
│ ✧˚ ༘♡ 🩸 Olá @${jid.split('@')[0]}
│ ✧˚ ༘♡ 🩸 Bem-vindo(a) ao
│ ✧˚ ༘♡ 🩸 L LAMINA SOMBRIO V20
│
│ ✧˚ ༘♡ 🩸 Tabela
│ ✧˚ ༘♡ 🩸 Pagamento
│
│ ✧˚ ༘♡ 🩸 Que seu ódio te fortaleça
╰─•❁ཻུ۪۪⸙ཻུ͎۪۪🩸ཻུ۪۪⸙ཻུ͎۪۪❁─╯`;

      await sock.sendMessage(remote, {
        image: { url: pp },
        caption: legenda,
        mentions: [jid]
      });
    }
  }
}
