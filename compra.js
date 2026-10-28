const fs = require('fs');
const dbFile = './database/compra.json';
if (!fs.existsSync('./database')) fs.mkdirSync('./database');

module.exports = {
name: 'compra',
alias: ['buy','comprar'],
run: async (m, { sock, args }) => {
    if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, '{}');
    let db = JSON.parse(fs.readFileSync(dbFile));
    let jid = m.key.remoteJid;
    if (!db[jid]) db[jid] = { users: {}, maior: { nome: 'Ninguém', total: 0 } };

    let qtdRaw = args[0] || '450';
    let qtd = parseInt(qtdRaw.replace(/[^0-9]/g, '')) || 450;
    let sender = m.key.participant || m.sender;
    let nome = m.pushName || 'Desconhecido';

    if (!db[jid].users[sender]) db[jid].users[sender] = { total: 0, compras: 0 };
    
    let userData = db[jid].users[sender];
    let primeira = userData.compras === 0;

    userData.total += qtd;
    userData.compras += 1;

    // Rank estilo Naruto
    let rank = 'Genin Fraco';
    if (userData.total > 1000) rank = 'Chunin 🩸';
    if (userData.total > 3000) rank = 'Jounin ⚔️';
    if (userData.total > 10000) rank = 'AKATSUKI 🥀';

    let compradores = Object.keys(db[jid].users).length;
    
    // Verifica se é o maior
    if (userData.total > db[jid].maior.total) {
        db[jid].maior = { nome, total: userData.total };
    }

    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

    let msg = primeira ? 
`🩸 *HN... ENTÃO É VOCÊ.*

Obrigado @${sender.split('@')[0]} por comprar *${qtd} MB*.

Primeira compra do dia... finalmente tomou coragem?
Não me faça perder tempo. 🥀

┏━━━ *LA LÂMINA REGISTRO* ━━━┓
┃ Comprador Nº: *${compradores}*
┃ Seu total: *${userData.total} MB*
┃ Rank: *${rank}*
┗━━━━━━━━━━━━━━━━━━━━┛

O mais forte aqui é *${db[jid].maior.nome}* com *${db[jid].maior.total} MB*.
Você ainda está muito atrás dele.

...Hn. Não me decepcione.` 
:
`⚔️ *VOCÊ DE NOVO.*

Obrigado @${sender.split('@')[0]} por comprar *${qtd} MB*.

${userData.compras}ª compra. Parece que não é tão fraco quanto pensei.
Mas ainda é fraco. 🩸

┏━━━ *LA LÂMINA REGISTRO* ━━━┓
┃ Comprador Nº: *${compradores}*
┃ Total acumulado: *${userData.total} MB*
┃ Rank: *${rank}*
┗━━━━━━━━━━━━━━━━━━━━┛

Maior comprador: *${db[jid].maior.nome}* - *${db[jid].maior.total} MB*
Alcance-o, se for capaz.`;

    await sock.sendMessage(jid, { text: msg, mentions: [sender] }, { quoted: m });
}
}
