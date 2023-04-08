module.exports.run = async (client, message, args, config) => {
  const { id, from } = message;
  const { prefix } = config;
  const arg = args.join(" ");
  try {
    if (!args)
      return client.reply(
        from,
        `Escribe *${prefix}tts [idioma] [texto]*, usa ${prefix}idioma para ver los idiomas disponibles \nAsegurate escribirlos bien!`
      );
    const arg = args.shift();
    const ttsGB = require("node-gtts")(arg);
    const dataText = args.join(" ");
    if (!dataText)
      return client.reply(
        from,
        `Escribe *${prefix}tts [idioma] [texto]*, ejemplo: ${prefix}tts es hola`,
        id
      );
    ttsGB.save("./media/audio/tts.mp3", dataText, function () {
      client.sendFile(from, "./media/audio/tts.mp3", "tts.mp3", "", id);
    });
  } catch (e) {
    let er = e.toString();
    let a = er.split(" ").pop();
    if (er.includes("Error: Language not supported:")) {
      const ar = "es";
      const ttsG = require("node-gtts")(ar);
      const dataTex = arg;
      ttsG.save("./media/audio/tts.mp3", dataTex, function () {
        client.sendFile(from, "./media/audio/tts.mp3", "tts.mp3", "", id);
      });
    } else {
      console.error(
        `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
        e.toString()
      );
      await client.reply(from, `Ocurrio un error`, id);
    }
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "tts",
  aliases: "tts",
  desc: "Envia audios en un lenguaje especifico",
};
