const sleep = require("ko-sleep");
module.exports.run = async (client, message, args, config) => {
  const { id, from } = message;
  const arg = args.join("");
  const isUrl = arg.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  );
  try {
    if (!arg) {
      await client.reply(
        from,
        `Envia el comando ${config.prefix}join [invitacion]`,
        id
      );
    } else {
      if (!isUrl) {
        await client.reply(from, `Envia un enlace de invitacion valido`, id);
      } else {
        await client
          .joinGroupViaLink(arg, { returnChatObj: true })
          .then((a) => {
            as = a;
          });
        await sleep(2 * 1000);
        client.sendText(
          as.id,
          `Gracias por la invitacion
Puedes escribir ${config.prefix}help para ver los comandos
Para resolver tus dudas sobre el desarrollo del bot, puedes contactarme aqui:
WhatsApp: wa.me/525633592644
Discord: Cyopn#7302
Instagram: https://instagram.com/Cyopn_`
        );
      }
    }
  } catch (e) {
    console.error(
      `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
      e
    );
    await client.reply(from, ` Ocurrio un error `, id);
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "join",
  aliases: "j",
  desc: "Añade el bot a un grupo con solo un comando",
};
