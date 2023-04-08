const { getBuffer, uploadImage } = require("../lib/functions");
module.exports.run = async (client, message) => {
  const { id, from, sender, author, quotedMsg, mentionedJidList } = message;
  let { pushname, verifiedName, formattedName } = sender;
  pushname = pushname || verifiedName || formattedName;

  try {
    let who = quotedMsg
      ? quotedMsg.author.replace("@c.us", "")
      : mentionedJidList && mentionedJidList[0]
      ? mentionedJidList[0].replace("@c.us", "")
      : author.replace("@c.us", "");

    let pic = await client.getProfilePicFromServer(who.concat("@c.us"));
    if (!pic || pic.includes("ERROR")) {
      await client.reply(
        from,
        `Debes tener foto de perfil para usar este comando\nSi no es el caso revisa la visibilidad en ajustes de privacidad o agrega al bot a tus contactos`,
        id
      );
    } else {
      const rs = await getBuffer(psend);
      let up = await uploadImage(rs);
      await client.sendFile(
        from,
        `https://some-random-api.ml/canvas/simpcard?avatar=${up}`,
        "yo.png",
        "",
        id
      );
    }
  } catch (e) {
    console.error(
      `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
      e.toString()
    );
    client.reply(from, `Ocurrio un error`, id);
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "simpcard",
  aliases: "scd",
  desc: "nose",
};
