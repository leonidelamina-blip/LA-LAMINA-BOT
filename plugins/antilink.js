
  }
};
module.exports = {
  cmd: ["antilink", "antilink2", "linkantilink"],
  run: async (c) => {
    const { sock, jid, sender, msg, isGroup, cfg } = c;
    
    if (!isGroup) return c.r(["❌ Só em grupo"]);
    
    // Pega metadados frescos, sem cache
    let meta;
    try {
      meta = await sock.groupMetadata(jid);
    } catch {
      return c.r(["❌ Erro ao pegar dados do grupo"]);
    }
    
    const participante = meta.participants.find(p => p.id === sender || p.id.split('@')[0] === sender.split('@')[0]);
    const isAdm = participante?.admin === 'admin' || participante?.admin === 'superadmin';
    const isDono = cfg.donos?.includes(sender.split('@')[0]) || c.isDono;
    
    // Se você é o Dono Leonide 852223969, sempre passa
    const numeroSender = sender.split('@')[0];
    const ehLeonide = numeroSender.includes('852223969') || numeroSender.includes('258852223969');
    
    if (!isAdm && !isDono && !ehLeonide) {
      return c.r([
        "🩸🚫 Só ADM. Você é fraco.",
        `Mas Dono Leonide (852223969) sempre é ADM Supremo 👁️`,
        `Seu número: ${numeroSender}`,
        `Admin detectado: ${isAdm ? 'SIM' : 'NÃO'}`
      ], { titulo: "ANTILINK" });
    }

    const db = c.cfg.db || {};
    if (!db.antilink) db.antilink = {};
    
    const arg = c.args[0]?.toLowerCase();
    
    if (arg === 'on' || arg === 'ativar') {
      db.antilink[jid] = true;
      return c.r([
        "🩸 Antilink ATIVADO!",
        "👁️ Vou apagar links de não-ADMs",
        "💰 M-Pesa: 852223969 - Leonide António Lâmina",
        "❌ e-Mola: Não disponível"
      ]);
    } else if (arg === 'off' || arg === 'desativar') {
      db.antilink[jid] = false;
      return c.r(["🩸 Antilink DESATIVADO!"]);
    } else {
      const status = db.antilink[jid] ? 'ATIVADO ✅' : 'DESATIVADO ❌';
      return c.r([
        `🩸 Antilink: ${status}`,
        `Use: .antilink on / .antilink off`,
        `Você: ${numeroSender} - ADM: ${isAdm ? 'SIM ✅' : 'NÃO ❌'} + Dono: ${isDono || ehLeonide ? 'SIM ✅' : 'NÃO'}`,
        `M-Pesa: 852223969 - Leonide`
      ]);
    }
  }
}
