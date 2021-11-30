const axios = require('axios')
const ytsr=require("ytsr")

module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    const isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
    const { zeeksKey, prefix } = config
    const arg = args.join('')

    try {
        if (!arg) return await client.reply(from, `Envia el comando *${prefix}play [consulta/url]`, id)
        await client.reply(from, `Espera un momento`, id)
        if (isUrl && arg.startsWith('www.youtu')) {
            const res = await axios.get(`https://api.zeks.me/api/ytmp3/2?apikey=${zeeksKey}&url=${as.url}?v`)
            let ytm = res.data.result
            if (res.status === false) await client.reply(res.data.message)
            await client.sendFileFromUrl(from, `${ytm.thumb}`, `${ytm.title}.jpg`, `Inicia la descarga de *${ytm.title}*\nTamaño: ${ytm.size}\nCalidad: ${ytm.quality}`)
            await client.sendFileFromUrl(from, `${ytm.link}`, `${ytm.title}.mp3`)
        } else {
            const a = await ytsr(arg, { limit: 1 })
            const as = a.items[0]
            const res = await axios.get(`https://api.zeks.me/api/ytmp3/2?apikey=${zeeksKey}&url=${as.url}?v`)
            let ytm = res.data.result
            if (res.status === false) await client.reply(res.data.message)
            await client.sendFileFromUrl(from, `${ytm.thumb}`, `${ytm.title}.jpg`, `Inicia la descarga de *${ytm.title}*\nTamaño: ${ytm.size}\nCalidad: ${ytm.quality}`)
            await client.sendFileFromUrl(from, `${ytm.link}`, `${ytm.title}.mp3`)
        }

    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }

}

module.exports.config = {
    name: "play",
    aliases: 'p',
    desc: 'Descarga una cancion'
}