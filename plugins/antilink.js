module.exports = {
  cmd: ["antilink"],
  run: async ({ sock, jid, sender, isDono, msg, r }) => {
    try {
      // Só funciona em grupo
      if (!jid.endsWith('@g.us')) return r("❌ Só funciona em grupo, Dono Leonide!");
      
      // Verifica se é ADM do grupo
      const metadata = await sock.groupMetadata(jid).catch(() => null);
      if (!metadata) return r("❌ Não consegui ver os ADMs");
      
      const participant = metadata.participants.find(p => p.id.split('@')[0].split(':')[0] === sender.split('@')[0].split(':')[0]);
      const isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
      
      // Só Dono ou ADM pode usar
      if (!isDono && !isAdmin) {
        return r("╭─❋!°❋🩸\n│ ❌ Só ADM pode usar .antilink\n│ Você não é ADM aqui!\n╰─❋!°❋🩸");
      }
      
      global.antilink = global.antilink || new Set();
      
      if (global.antilink.has(jid)) {
        global.antilink.delete(jid);
        return r(`╭─❋!°❋🩸\n│ 🩸 Antilink DESATIVADO ❌\n│ Por: ${isDono ? 'Dono Leonide' : 'ADM'}\n╰─❋!°❋🩸`);
      } else {
        global.antilink.add(jid);
        return r(`╭─❋!°❋🩸\n│ 🩸 Antilink ATIVADO ✅\n│ Ativado por: ${isDono ? 'Dono Leonide' : 'ADM'}\n│ Apaga links de fora\n╰─❋!°❋🩸\n│ Dono: 852223969 - M-Pesa`);
      }
    } catch (e) {
      return r("❌ Erro no antilink: " + e.message);
    }
  }
};
