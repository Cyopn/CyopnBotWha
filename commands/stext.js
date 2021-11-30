const axios = require('axios')
const { getBuffer } = require('../lib/functions')


module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    const { prefix } = config
    const arg = args.join(' ')
    try {
        if (!args) {
            await client.reply(`Envia un texto con el comando *${prefix}stext [texto]*, ejemplo : ${prefix}stext Hola`)
        } else {
            await client.reply(from, `Espera un poco`, id)
            const res = await getBuffer(`https://api.xteam.xyz/attp?file&text=${arg}`)
            if (res === undefined) {
                await client.reply(from, 'Ocurrio un error', id)
            } else {
                await client.sendImageAsSticker(from, res, {
                    author: 'ig: @Cyopn_',
                    pack: 'CyopnBot'
                })
            }


        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "stext",
    aliases: 'st',
    desc: 'Crea un sticker a partir de texto'
}