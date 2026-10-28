module.exports = {
name: 'revelar',
alias: ['rev','ver','r'],
run: async (m, { sock }) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    // Se não for mídia de visualização única
    if (!q.message?.viewOnceMessage && !q.message?.viewOnceMessageV2 && !mime) {
        return await sock.sendMessage(m.key.remoteJid, { 
            text: `🩸 *Hn... idiota.*

Responda a uma imagem de visualização única.

Você ainda é fraco demais pra entender isso? 🥀` 
        }, { quoted: m });
    }

    try {
        // Baixa a mídia
        let buffer = await sock.downloadMediaMessage(q);
        
        let tipo = /image/.test(mime) ? 'image' : /video/.test(mime) ? 'video' : 'image';
        
        let legenda = `⚔️ *REVELADO.*

Você achou que poderia esconder isso de mim?
Patético. 🩸

┏━━━ *LA LÂMINA* ━━━┓
┃ By: Sasuke Uchiha 🥀
┗━━━━━━━━━━━━━━━━┛`;

        if (tipo === 'image') {
            await sock.sendMessage(m.key.remoteJid, { image: buffer, caption: legenda }, { quoted: m });
        } else {
            await sock.sendMessage(m.key.remoteJid, { video: buffer, caption: legenda }, { quoted: m });
        }

    } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🩸 *Falhou.*

Essa lâmina não conseguiu revelar...
O jutsu dela é mais forte. 🥀` 
        }, { quoted: m });
    }
}
}