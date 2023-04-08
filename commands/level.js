const db = require("megadb");
const lvldB = new db.crearDB({
  nombre: "dataLevel",
  carpeta: "./database",
});

module.exports.run = async (client, message) => {
  const { id, from, author, isGroupMsg, chat, quotedMsg, mentionedJidList } =
    message;
  if (!isGroupMsg)
    return client.reply(from, `Comando solo disponible en grupos`, id);
  const groupId = isGroupMsg ? chat.groupMetadata.id.replace("@g.us", "") : "";
  let sid = quotedMsg
    ? quotedMsg.author.replace("@c.us", "")
    : mentionedJidList && mentionedJidList[0]
    ? mentionedJidList[0].replace("@c.us", "")
    : author.replace("@c.us", "");
  try {
    if (lvldB.has(groupId) && lvldB.has(`${groupId}.${sid}`)) {
      const { xp, level } = await lvldB.get(`${groupId}.${sid}`);
      let lvlup = 5 * level ** 2 + 50 * level + 100;
      if (xp === 0) {
        await client.reply(
          from,
          `Aun no envias suficientes mensajes para tener un nivel o experiencia`,
          id
        );
      } else {
        await client.sendReplyWithMentions(
          from,
          `Buen trabajo @${sid.concat("@c.us")}!
*Experiencia: ${xp}*
*Nivel: ${level}*
_Necesitas ${lvlup - xp} puntos de experiencia mas para subir de nivel_`,
          id
        );
      }
    } else {
      lvldB.set(`${groupId}.${sid}`, {
        xp: 0,
        level: 1,
      });
    }
  } catch (e) {
    console.error(
      `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
      e.String()
    );
    await client.reply(from, `Ocurrio un error`, id);
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "level",
  aliases: "lvl",
  desc: "Obten informacion sobre tu nivel y expetiencia (o el de otro miembro).",
};
