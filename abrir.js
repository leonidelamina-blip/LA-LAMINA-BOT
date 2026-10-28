module.exports = {
  name: "abrir",
  alias: ["on"],
  run: async (ctx) => {
    const { sock, remote } = ctx;
    await sock.sendMessage(remote, { 
      text: `🩸👁️ *SISTEMA ABERTO* - Sharingan Ativo\n\n✅ Bot online e liberado.`
    });
  }
}
