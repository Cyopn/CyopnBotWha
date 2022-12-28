const { decryptMedia } = require('@open-wa/wa-decrypt')
const { createSt } = require('../lib/functions')
const fs = require('fs')

module.exports.run = async(client, message, args, config) => {
    const { type, id, from, isMedia, quotedMsg } = message
    const isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
    const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

    try {
        if (isMedia && type === 'image') {
            const mediaData = await decryptMedia(message, uaOverride)
            fs.writeFile('./media/images/imgSt.jpg', mediaData, function(err) {
                if (err) {
                    return console.error(err);
                }
            });

            await createSt(client, message)

        } else if (quotedMsg && quotedMsg.type === 'image') {
            const mediaData = await decryptMedia(quotedMsg, uaOverride)
            fs.writeFile('./media/images/imgSt.jpg', mediaData, function(err) {
                if (err) {
                    return console.error(err);
                }
            });

            await createSt(client, message)

        } else if (args.length >= 1) {
            const url = args.join('')
            if (url.match(isUrl)) {
                await client.sendStickerfromUrl(from, url, { method: 'get' }, {
                        author: 'ig: @Cyopn_',
                        pack: 'CyopnBot'
                    })
                    .catch(err => console.error(err))
            } else {
                await client.reply(from, `El enlace no es valido`, id)
            }
        } else {
            await client.reply(from, `Envia una imagen con el comando *${config.prefix}sticker*, responde a una imagen ya enviada o un link`, id)
        }

    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "sticker",
    aliases: 's',
    desc: 'Crea stickers'
}