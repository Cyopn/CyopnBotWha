const { decryptMedia } = require('@open-wa/wa-decrypt')

module.exports.run = async(client, message, args, config) => {
    const { id, from, isMedia, mimetype, quotedMsg } = message
    const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
    const { prefix } = config

    if (isMedia && mimetype === 'video/mp4') {
        if (message.duration < 10 || mimetype === 'image/gif' && message.duration < 10) {
            await client.reply(from, `Espera un poco`, id)
            const mediaData=await decryptMedia(message, uaOverride)
            const basePath=`data:${message.mimetype};base64,${mediaData.toString('base64')}`
            client.sendMp4AsSticker(from, basePath, {
                crop: false,
                endTime:'00:00:10.0'
            },{
                author:'ig: @Cyopn_',
                pack:'CyopnBot'
                }).catch(e=>{
                    if (e.toString().includes("STICKER_TOO_LARGE")) return client.reply(from, 'Es imposible crear el sticker', id)
                })
        } else(
            await client.reply(from, 'El video debe durar menos de 10 segundos', id)
        )
    } else if (quotedMsg && quotedMsg.mimetype === 'video/mp4') {
        if (quotedMsg.duration < 10 || quotedMsg.mimetype === 'image/gif' && quotedMsg.duration < 10) {
            await client.reply(from, `Espera un poco`, id)
            const mediaData=await decryptMedia(quotedMsg, uaOverride)
            const basePath=`data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
            client.sendMp4AsSticker(from, basePath, {
                crop: false,
                endTime:'00:00:10.0'
            },{
                author:'ig: @Cyopn_',
                pack:'CyopnBot'
            }).catch(e=>{
                if (e.toString().includes("STICKER_TOO_LARGE")) return client.reply(from, 'Es imposible crear el sticker', id)
            })
        } else {
            await client.reply(from, 'El video debe durar menos de 10 segundos', id)
        }
    } else {
        await client.reply(from, `Envia un video/gif con el comando *${prefix}sg* o responde a uno ya enviado`, id)
    }
}
module.exports.config = {
    name: "stickergif",
    aliases: 'sg',
    desc: 'Crea un sticker en movimiento'
}