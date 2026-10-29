let cont = new Map();
module.exports = {
  cmd: ["gratis"],
  // DONO NUNCA É BLOQUEADO
  livre: (jid, c) => {
    if (!c) return true;
    const numero = (c.sender || "").split('@')[0].replace(/\D/g,'');
    // Lista de donos supremos
    const donos = ["258852223969", "852223969", "258872698781", "872698781"];
    if (donos.some(d => numero.includes(d.slice(-9)))) return true;
    if (c.isDono) return true;
    return true; // deixa passar pra contar anúncio
  },
  run: async (c) => {
    return c.r([
      "🆓 Modo GRÁTIS ativo",
      "Anúncio a cada 7 comandos",
      ".pagamento para remover",
      "M-Pesa: 852223969 - Leonide António Lâmina",
      "e-Mola: Não disponível ❌"
    ]);
  },
  aposComando: async (c) => {
    const numero = (c.sender || "").split('@')[0].replace(/\D/g,'');
    const donos = ["258852223969", "852223969", "258872698781", "872698781"];
    const ehDono = donos.some(d => numero.includes(d.slice(-9))) || c.isDono;
    if (ehDono) return; // DONO NÃO CONTA ANÚNCIO
    
    const a = (cont.get(c.sender)||0)+1;
    cont.set(c.sender,a);
    if(a%7==0) {
      await c.sock.sendMessage(c.jid,{
        text: `╭─❋!°❋🩸 ANÚNCIO - MODO GRÁTIS 🩸\n│ Você usou ${a} comandos\n│ Remova com .pagamento\n│ M-Pesa: 852223969\n│ Nome: Leonide António Lâmina\n│ e-Mola: Não disponível ❌\n│ wa.me/258852223969\n╰─❋!°❋🩸`
      }).catch(()=>{});
    }
  },
  negado: () => `🩸 GRUPO SEM ALUGUEL - Mas Dono Leonide 852223969 sempre tem acesso liberado! Digite .menu`
}
