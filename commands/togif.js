const { decryptMedia } = require('@open-wa/wa-decrypt')
const { createSt } = require('../lib/functions')
const fs = require('fs')

module.exports.run = async(client, message, args, config) => {
    const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
    const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

    try {
        const mediaData = await decryptMedia(quotedMsg, uaOverride)
        fs.writeFile('./media/gifs/togif.gif', mediaData, function(err) {
            if (err) {
                return console.error(err);
            }
        });

        client.sendVideoAsGif(from, './media/gifs/togif.gif', 'yo.gif', '')


    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "togif",
    aliases: 'tgi',
    desc: 'Covierte un sticker de con movimiento a gif'
}