const { decryptMedia } = require('@open-wa/wa-decrypt')
const fs = require("fs")
const { exec } = require("child_process")
const getVideoDimensions = require('get-video-dimensions')

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
                    if (e.toString().includes("Error: Request failed with status code 550")) return client.reply(from, 'Es imposible crear el sticker, el archivo es demasiado pesado', id)
                })
            } else {
                await client.reply(from, 'El video debe durar menos de 10 segundos', id)
            }
        } else if (quotedMsg && quotedMsg.mimetype === 'video/mp4') {
            if (quotedMsg.duration <= 10 || quotedMsg.mimetype === 'image/gif' && quotedMsg.duration <= 10) {
                await client.reply(from, `Espera un poco x`, id)
                const mediaData = await decryptMedia(quotedMsg)
                fs.writeFile("./media/images/r.mp4", mediaData, function (e) {
                    if (e) return console.log(e)
                })

                let a = await getVideoDimensions("./media/images/r.mp4")
                console.log(a)
                let b=[0, 0]
                if (a.width < a.height) {
                    b[0]=512
                    b[1]=(a.height*512)/a.width
                }else if(a.height<a.width){
                    b[1]=512
                    b[0]=(a.height*512)/a.width
                }

                const ex = require("child_process").execSync

                const rs=ex(`ffmpeg -i ./media/images/r.mp4 -vf scale=${b[1]}:${b[0]} -preset slow -crf 18 ./media/images/r2.mp4`)

                fs.unlink("./media/images/r.mp4", function(e){
                    if(e)return console.log(e)
                })

                fs.unlink("./media/images/r2.mp4", function(e){
                    if(e)return console.log(e)
                })

                await client.sendMp4AsSticker(from, `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`, { crop: false }, {
                    author: '.',
                    pack: '.'
                }).catch(e => {
                    if (e.toString().includes("Error: Request failed with status code 550")) return client.reply(from, 'Es imposible crear el sticker, el archivo es demasiado pesado', id)
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