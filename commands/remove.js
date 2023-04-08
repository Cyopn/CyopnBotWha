module.exports.run = async (client, message, args, config) => {
  const { id, from, mentionedJidList, author, isGroupMsg, chat } =
    message;
  const groupId = isGroupMsg ? chat.groupMetadata.id : "";
  let adm = await client.getGroupAdmins(groupId);
  let selfadm = await client.iAmAdmin();
  try {
    if (!isGroupMsg)
      return client.reply(from, "Comando solo disponible para grupos", id);
    if (selfadm.indexOf(groupId) == -1)
      return client.reply(
        from,
        "Para usar este comando debo ser administrador del grupo",
        id
      );
    if (adm.indexOf(author) == -1)
      return client.reply(
        from,
        "Para usar este comando debes ser administrador",
        id
      );
    if (mentionedJidList.length == 0) {
      await client.reply(
        from,
        `Debes mecionar a un usuario: _${config.prefix}remove @nose_`,
        id
      );
    } else {
      await client.removeParticipant(groupId, mentionedJidList[0]);
      await client.reply(from, `Se ha elimidado al participante`, id);
    }
  } catch (e) {
    console.error(
        `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
        e.toString()
      );
    await client.reply(from, `Ocurrio un error`, id);
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "remove",
  aliases: "rv",
  desc: "Obten ayuda si existe algun problema",
};
