module.exports.run = async (client, message, args, config) => {
    const { id, from, mentionedJidList, quotedMsg, author, isGroupMsg, chat } = message
    const groupId = isGroupMsg ? chat.groupMetadata.id : ''
    let adm = await client.getGroupAdmins(groupId)
    let selfadm = await client.iAmAdmin()
    try {
        if (!isGroupMsg) return client.reply(from, 'Comando solo disponible para grupos', id)
        if (selfadm.indexOf(groupId) == -1) return client.reply(from, 'Para usar este comando debo ser administrador del grupo', id)
        if(adm.indexOf(author)==-1)return client.reply(from, 'Para usar este comando debes ser administrador', id)
        await client.setGroupToAdminsOnly(groupId, true)
        await client.reply(from, `El grupo solo esta disponible para adminsitradores`, id)
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "closegp",
    aliases: 'clp',
    desc: 'Cierra el grupo'
}