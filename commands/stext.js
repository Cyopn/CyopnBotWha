const axios = require('axios')
const { getBuffer } = require('../lib/functions')


module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    const { prefix } = config
    const arg = args.join(' ')
    try {
        if (!args) {
            client.reply(`Envia un texto con el comando *${prefix}stext [texto]*, ejemplo : ${prefix}stext Hola`)
        } else {
            client.reply(from, `Espera un poco`, id)
            const res = await getBuffer(`https://api.xteam.xyz/attp?file&text=${arg}`)
            if (res === undefined) {
                client.reply(from, 'Ocurrio un error', id)
            } else {
                client.sendImageAsSticker(from, res, {
                    author: 'ig: @Cyopn_',
                    pack: 'CyopnBot'
                })
            }


        }
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "stext",
    aliases: 'st',
    desc: 'Crea un sticker a partir de texto'
}