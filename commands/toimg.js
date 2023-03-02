const { decryptMedia } = require('@open-wa/wa-decrypt')
const fs = require('fs')
const { getBuffer, uploadImage } = require("../lib/functions")
const path = require('path')

module.exports.run = async (client, message, args, config) => {
    const { id, from, quotedMsg } = message
    const { prefix } = config
    try {
        if (quotedMsg && quotedMsg.type === 'sticker') {
            await client.reply(from, `Espera un poco`, id)
            const mediaData = await decryptMedia(quotedMsg)
            const imageBase64 = `data:image/png;base64,${mediaData.toString(
                'base64'
            )}`;
            await client.sendFile(from, imageBase64, "we.png", ``, id)
        } else {
            await client.reply(from, `Usa *${prefix}toimg* respondiendo un sticker`, id)
        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "toimg",
    aliases: 'ti',
    desc: 'Convierte un sticker a imagen'
}