const axios = require("axios").default;

module.exports.run = async (client, message, args, config) => {
  const { id, from } = message;
  let arg = args.join("");
  try {
    if (!arg)
      return await client.reply(
        from,
        `Envia tu consulta con el comando *${config.prefix}twitter [url]*`,
        id
      );
    await client.reply(from, `Espera un poco`, id);
    let response = await axios.get(
      `https://api.zahwazein.xyz/downloader/twitter?apikey=${config.zenKey}&url=${arg}`
    );
    if (!response.data.result.hd) {
      await client.reply(from, `El enlace no es valido`, id);
    } else if (response.data.status == "OK") {
      await client.sendFileFromUrl(
        from,
        `${response.data.result.hd}`,
        "",
        `w`,
        id
      );
    } else {
      await client.reply(from, `Ocurrio un error`, id);
    }
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
  name: "twitter",
  aliases: "tw",
  desc: "Descarga algun video de twitter",
};
