module.exports = {
  cmd: ["aluguel", "alugar"],
  run: async (c) => {
    const numero = (c.sender || "").split('@')[0].replace(/\D/g,'');
    const donos = ["258852223969", "852223969", "258872698781", "872698781"];
    const ehDono = donos.some(d => numero.includes(d.slice(-9))) || c.isDono;
    
    if (!ehDono) {
      return c.r([
        "❌ Só o Dono Leonide pode usar .aluguel",
        "Contato: wa.me/258852223969",
        "M-Pesa: 852223969"
      ]);
    }
    
    const arg = c.args[0];
    if (arg === "liberar" || arg === "ativar" || arg === "add") {
      // Libera o grupo atual
      if (!global.gruposAluguel) global.gruposAluguel = new Set();
      global.gruposAluguel.add(c.jid);
      return c.r([
        `✅ Grupo ${c.jid} LIBERADO pelo Dono Leonide!`,
        "Agora .menu funciona sem 'aluguel ativo'",
        "M-Pesa: 852223969"
      ]);
    }
    
    return c.r([
      "🩸 Sistema de Aluguel - Dono: Leonide António Lâmina",
      "Comandos:",
      ".aluguel liberar - Libera este grupo",
      ".aluguel add @grupo dias - Adiciona aluguel",
      "Seu número: " + numero + " - Dono: " + (ehDono ? "SIM ✅" : "NÃO ❌"),
      "M-Pesa: 852223969 - e-Mola: Não disponível ❌"
    ]);
  },
  // ESSENCIAL: Dono sempre passa
  livre: (jid, c) => {
    if (!c) return true;
    const numero = (c.sender || "").split('@')[0].replace(/\D/g,'');
    const donos = ["258852223969", "852223969", "258872698781", "872698781"];
    return donos.some(d => numero.includes(d.slice(-9))) || c.isDono || true;
  }
}
