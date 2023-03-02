module.exports.run = async (client, message, args, config) => {
    const { id, from, mentionedJidList, quotedMsg, author, isGroupMsg, chat } = message
    const groupId = isGroupMsg ? chat.groupMetadata.id : ''
    let adm = await client.getGroupAdmins(groupId)
    let selfadm = await client.iAmAdmin()
    try {
        if (!isGroupMsg) return client.reply(from, 'Comando solo disponible para grupos', id)
        if (selfadm.indexOf(groupId) == -1) return client.reply(from, 'Para usar este comando debo ser administrador del grupo', id)
        if(adm.indexOf(author)==-1)return client.reply(from, 'Para usar este comando debes ser administrador', id)
        if (mentionedJidList.length == 0) {
            await client.reply(from, `Debes mecionar a un usuario: _${config.prefix}remove @nose_`, id)
        } else {
            if (adm.indexOf(mentionedJidList[0]) != -1) {
                await client.demoteParticipant(groupId, mentionedJidList[0])
                await client.sendReplyWithMentions(from, `El participante @${mentionedJidList[0]} ha sido degradado de administrador`, id)
            } else {
                await client.reply(from, `El participante no es administrador`, id)
            }
        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "demote",
    aliases: 'dt',
    desc: 'Degrada algun participante de administrador'
}