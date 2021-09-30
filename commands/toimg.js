module.exports.run = async(client, message, args, config) => {
    const { id, from, quotedMsg } = message
    const { prefix } = config

    try {
        if (quotedMsg && quotedMsg.type == 'sticker') {
            const mediaData = await decryptMedia(quotedMsg)
            client.reply(from, `Espera un poco`, id)
            const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
            client.sendFile(from, imageBase64, 'imgsticker.jpg', '', id)
        } else {
            client.reply(from, `Usa *${prefix}toimg* respondiendo un sticker`)
        }
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "toimg",
    aliases: 'ti',
    desc: 'Convierte un sticker a imagen'
}