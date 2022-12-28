const sleep = require('ko-sleep')
module.exports.run = async(client, message, args, config) => {
    const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
    const arg = args.join("")
    const isUrl = arg.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
    try {
        if (!arg) {
            await client.reply(from, `Envia el comando ${config.prefix}join [invitacion]`, id)
        } else {
            if (!isUrl) {
                await client.reply(from, `Envia un enlace de invitacion valido`, id)
            } else {
                await client.joinGroupViaLink(arg, { returnChatObj: true }).then(a => {
                    as = a
                })
                await sleep(2 * 1000)
                client.sendText(as.id, `Holi uwu`)
            }
        }
    } catch (e) {
        console.error(e)
        await client.reply(from, ` Ocurrio un error `, id)
    }
}

module.exports.config = {
    name: "join",
    aliases: 'j',
    desc: 'Añade el bot a un grupo con solo un comando'
}