const ex = require("child_process").execSync;
const { loadJson } = require("../lib/functions");

module.exports.run = async (client, message) => {
  const { id, from } = message;
  try {
    const rs = ex(`python ./lib/python/meme.py`, { encoding: "utf8" });

    loadJson().then((a) => {
      client.sendFileFromUrl(
        from,
        a.url,
        "yo.jpg",
        `${a.title}
Publicado por u/${a.author}`,
        id
      );
    });
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
  name: "meme",
  aliases: "m",
  desc: "Momazos en r/ChingaTuMadreNoko",
};
