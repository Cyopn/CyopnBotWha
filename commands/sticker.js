const { decryptMedia } = require('@open-wa/wa-decrypt')

module.exports.run = async (client, message, args, config) => {
    const { type, id, from, isMedia, quotedMsg, mimetype } = message

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
        } else if (isMedia && mimetype === 'video/mp4') {
            if (message.duration <= 10 || mimetype === 'image/gif' && message.duration <= 10) {
                await client.reply(from, `Espera un poco`, id)
                const mediaData = await decryptMedia(message)
                await client.sendMp4AsSticker(from, `data:${message.mimetype};base64,${mediaData.toString('base64')}`, {
                    crop: false
                }, {
                    author: 'ig: @Cyopn_',
                    pack: 'CyopnBot'
                }).catch(e => {
                    console.log(e.toString())
                    if (e.toString().includes("STICKER_TOO_LARGE: maxContentLength size of 1500000 exceeded")) return client.reply(from, 'Es imposible crear el sticker, el archivo es demasiado pesado', id)
                })
            } else {
                await client.reply(from, 'El video debe durar menos de 10 segundos', id)
            }
        } else if (quotedMsg && quotedMsg.mimetype === 'video/mp4') {
            if (quotedMsg.duration <= 10 || quotedMsg.mimetype === 'image/gif' && quotedMsg.duration <= 10) {
                await client.reply(from, `Espera un poco`, id)
                const mediaData = await decryptMedia(quotedMsg)

                await client.sendMp4AsSticker(from, `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`, { crop: false }, {
                    author: 'ig: @Cyopn_',
                    pack: 'CyopnBot'
                }).catch(e => {
                    console.log(e.toString())
                    if (e.toString().includes("STICKER_TOO_LARGE: maxContentLength size of 1500000 exceeded")) return client.reply(from, 'Es imposible crear el sticker, el archivo es demasiado pesado', id)
                })

            } else {
                await client.reply(from, 'El video debe durar menos de 10 segundos', id)
            }
        } else {
            await client.reply(from, `Envia una imagen/video/gif con el comando *${config.prefix}sticker*, responde a una imagen ya enviada o un link`, id)
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