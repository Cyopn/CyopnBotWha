const axios = require("axios")
module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    const { prefix, zeeksKey } = config
    const arg = args.join("")
    try {
        if (!arg) {

            await client.reply(from, `Envia el comando *${prefix}telest [url], la url debe ser directo al paquete de stickers. \nEs recomendable no usar el comando en grupos, para evitar spam`, id)
        } else {
            /* const response = await axios.get(`https://api.zeks.me/api/telegram-sticker?apikey=${zeeksKey}&url=${args.join("")}`)
            const res = response.data.result

            if (res === undefined) {
                await client.reply(from, `Ha ocurrido un error, asegurate que el paquetede stickers NO sean animados`, id)
            } else {
                await client.reply(from, `Enviando ${res.length} stickers`, id)
                res.forEach(r => {
                    client.sendStickerfromUrl(from, r, { method: 'get' }, {
                        author: 'ig: @Cyopn_',
                        pack: 'CyopnBot'
                    })
                });
            } */
            const response = await axios.get(`https://api.lolhuman.xyz/api/telestick?apikey=21266c3397b7ce9153f21a33&url=${args.join("")}`)
            const res = response.data.result.sticker
            await client.reply(from, `Enviando ${res.length} stickers`, id)
            res.forEach(r => {
                client.sendStickerfromUrl(from, r, { method: 'get' }, {
                    author: 'ig: @Cyopn_',
                    pack: 'CyopnBot'
                })
            });
        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "telest",
    aliases: 'tst',
    desc: 'Obten stickers de Telegram solo con su enlace directo, no disponible con stickers animados'
}