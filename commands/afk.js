const db = require("megadb");
const afkdB = new db.crearDB({
  nombre: "dataAkf",
  carpeta: "./database",
});
const sleep = require("ko-sleep");
module.exports.run = async (client, message, args, config) => {
  const { id, from, author, isGroupMsg, chat } = message;
  let tim = args[args.length - 1];
  let razon = args.join(" ").replace(` ${tim}`, "");
  const { prefix } = config;
  let time = parseInt(tim, 10);
  const s = time * 60;
  let count = 1;
  try {
    if ((!razon && !time) || isNaN(time)) {
      await client.reply(
        from,
        `Envia el comando ${prefix}afk _[razon] [tiempo(minutos)]_`,
        id
      );
    } else {
      if (!isGroupMsg) return;
      const groupId = isGroupMsg
        ? chat.groupMetadata.id.replace("@g.us", "")
        : "";
      const sid = author.replace("@c.us", "");
      if (
        message.fromMe ||
        message.isMedia ||
        message.type === "image" ||
        message.type === "sticker" ||
        message.type === "ptt"
      )
        return;

      if (afkdB.has(groupId) && afkdB.has(`${groupId}.${sid}`)) {
        let { status, reason, delay } = await afkdB.get(`${groupId}.${sid}`);
        if (status === "afk") {
          await client.reply(
            from,
            `Por el momento ya estas en akf, espera _~${(delay / 60).toFixed(
              2
            )} minuto(s)_ para intentar de nuevo`,
            id
          );
        } else if (status === "none") {
          afkdB.set(`${groupId}.${sid}`, {
            status: "afk",
            reason: razon,
            delay: s,
          });
          await client.reply(
            from,
            `Se ha establecido afk correctamente \n_Razon: ${razon}_ \n_Tiempo: ${time} minutos_`,
            id
          );
          while (count < s) {
            afkdB.set(`${groupId}.${sid}`, {
              status: "afk",
              reason: razon,
              delay: s - count,
            });
            count++;
            await sleep(1 * 1000);
          }
          if (count === s) {
            afkdB.set(`${groupId}.${sid}`, {
              status: "none",
              reason: "none",
              delay: 0,
            });
          }
        }
      } else {
        afkdB.set(`${groupId}.${sid}`, {
          status: "afk",
          reason: razon,
          delay: s,
        });
        await client.reply(
          from,
          `Se ha establecido afk correctamente \n_Razon: ${razon}_ \n_Tiempo: ${time} minutos_`,
          id
        );
        while (count < s) {
          afkdB.set(`${groupId}.${sid}`, {
            status: "afk",
            reason: razon,
            delay: s - count,
          });
          count++;
          await sleep(1 * 1000);
        }
        if (count === s) {
          afkdB.set(`${groupId}.${sid}`, {
            status: "none",
            reason: "none",
            delay: 0,
          });
        }
      }
    }
  } catch (e) {
    console.error(
      `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
      e
    );
    await client.reply(from, `Ocurrio un error`, id);
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "afk",
  aliases: "af",
  desc: "Establece tiempo en el que no estes disponible",
};
