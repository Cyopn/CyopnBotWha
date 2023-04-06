module.exports.run = async (client, message) => {
  const { id, from } = message;
  try {
    await client.reply(
      from,
      `Para resolver tus dudas sobre el desarrollo del bot, puedes contactarme aqui:
WhatsApp: wa.me/525633592644
Discord: Cyopn#7302`,
      id
    );
  } catch (e) {
    console.error(
      `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
      e.toString()
    );
    await client.reply(from, `Ocurrio un error`, id);
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "suport",
  aliases: "sp",
  desc: "Obten ayuda si existe algun problema",
};
