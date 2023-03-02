const axios = require('axios')

module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    const arg = args.join('')
    const isUrl = arg.match(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/img)

    try {
        if (!arg) return await client.reply(from, `Envia el comando *${config.prefix}videodl [url]*`, id)
        await client.reply(from, `Espera un momento`, id)
        if (isUrl) {
            let r = await axios.get(`https://api.zahwazein.xyz/downloader/youtube?apikey=${config.zenKey}&url=${arg}`)
            if (r.data.status == 'OK') {
                await client.sendFileFromUrl(from, `${r.data.result.thumb}`, `a.jpg`, `Inicia la descarga de *${r.data.result.title}* \nCanal/Autor: ${r.data.result.channel}`, id)
                await client.sendFileFromUrl(from, `${r.data.result.getVideo}`, `a.mp4`, "", id)
            }else{
            await client.reply(from, `El servicio no esta disponible`, id)
            }
        } else {
            await client.reply(from, `El enlace no es valido`, id)
        }
    } catch (e) {
        console.log(e)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "videodl",
    aliases: 'vd',
    desc: 'Descarga videos cortos de youtube'
}