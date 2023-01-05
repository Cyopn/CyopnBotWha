const { decryptMedia } = require('@open-wa/wa-decrypt')

module.exports.run = async(client, message, args, config) => {
    const { type, id, from, isMedia, quotedMsg } = message
    
    try {
        if (isMedia && type === 'image') {

            const mediaData = await decryptMedia(message);
            const imageBase64 = `data:${message.mimetype};base64,${mediaData.toString(
                'base64'
            )}`;
            client.sendImageAsSticker(from, imageBase64, {
                author: 'ig: @Cyopn_',
                pack: 'CyopnBot',
                keepScale: true
            })

        } else if (quotedMsg && quotedMsg.type === 'image') {

            const mediaData = await decryptMedia(quotedMsg);
            const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString(
                'base64'
            )}`;
            client.sendImageAsSticker(from, imageBase64, {
                author: 'ig: @Cyopn_',
                pack: 'CyopnBot',
                keepScale: true
            })
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