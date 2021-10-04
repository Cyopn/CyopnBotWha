module.exports.run = async(client, message, args, config) => {
    try {
        const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        var { name, formattedTitle } = chat
        let { pushname } = sender

        client.sendTextWithMentions(from, `@${sender.id}`, id)
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "pin",
    aliases: 'pi',
    desc: 'ola'
}