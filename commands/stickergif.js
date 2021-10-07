const { decryptMedia } = require('@open-wa/wa-decrypt')
const { exec } = require('child_process')
const fs = require('fs')

module.exports.run = async(client, message, args, config) => {
    const { id, from, isMedia, mimetype, quotedMsg } = message
    const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
    const { prefix } = config

    try {
        if (isMedia && mimetype === 'video/mp4') {
            if (message.duration < 10 || mimetype === 'image/gif' && message.duration < 10) {
                client.reply(from, `Espera un poco`, id)
                const mediaData = await decryptMedia(message, uaOverride)
                const filename = `./media/gifs/stickergif.${mimetype.split('/')[1]}`
                await fs.writeFileSync(filename, mediaData)
                client.sendMp4AsSticker(from, `./media/gifs/stickergif.mp4`, {
                    crop: false
                }, {
                    author: 'ig: @Cyopn_',
                    pack: 'CyopnBot'
                })
            } else(
                client.reply(from, 'El video debe durar menos de 10 segundos', id)
            )
        } else if (quotedMsg && quotedMsg.mimetype === 'video/mp4') {
            if (quotedMsg.duration < 10 || quotedMsg.mimetype === 'image/gif' && quotedMsg.duration < 10) {
                client.reply(from, `Espera un poco`, id)
                const mediaData = await decryptMedia(quotedMsg, uaOverride)
                const filename = `./media/gifs/stickergif.${quotedMsg.mimetype.split('/')[1]}`
                await fs.writeFileSync(filename, mediaData)
                client.sendMp4AsSticker(from, `./media/gifs/stickergif.mp4`, {
                    crop: false
                }, {
                    author: 'ig: @Cyopn_',
                    pack: 'CyopnBot'
                })
            } else {
                client.reply(from, 'El video debe durar menos de 6 segundos', id)
            }
        } else {
            client.reply(from, `Envia un video/gif con el comando *${prefix}sg* o responde a uno ya enviado`, id)
        }
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}
module.exports.config = {
    name: "stickergif",
    aliases: 'sg',
    desc: 'Crea un sticker en movimiento'
}