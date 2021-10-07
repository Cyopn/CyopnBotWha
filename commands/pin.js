const { decryptMedia } = require('@open-wa/wa-decrypt')

module.exports.run = async(client, message, args, config) => {
    const { id, from, quotedMsg } = message
    const { prefix } = config
    const fs = require('fs')






    try {
        if (quotedMsg && quotedMsg.type == 'sticker') {
            client.reply(from, `Espera un poco`, id)
            const mediaData = await decryptMedia(quotedMsg)
            const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
        } else {
            client.reply(from, `Usa *${prefix}toimg* respondiendo un sticker`)
        }
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