const { decryptMedia } = require('@open-wa/wa-decrypt')
module.exports.run = async(client, message, args, config) => {
    const { id, from, quotedMsg } = message
    const { prefix } = config
    const fs = require('fs')

    try {
        if (quotedMsg && quotedMsg.type === 'sticker') {
            await client.reply(from, `Espera un poco`, id)
            const mediaData = await decryptMedia(quotedMsg)
            fs.writeFile('./media/images/imgRs.png', mediaData, function(err) {
                if (err) {
                    return console.error(err);
                }
            });
            await client.sendFile(from, './media/images/imgRs.png', id)
        } else {
            await client.reply(from, `Usa *${prefix}toimg* respondiendo un sticker`, id)
        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "toimg",
    aliases: 'ti',
    desc: 'Convierte un sticker a imagen'
}