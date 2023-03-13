const axios = require("axios").default

module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    let arg = args.join('')
    try {
        if (!arg) return await client.reply(from, `Envia tu consulta con el comando *${config.prefix}tiktok [url]*, ejemplo : ${config.prefix}tiktok https://vm.tiktok.com/ZM8KHKpUv`, id)
        await client.reply(from, `Espera un poco`, id)
        let response = await axios.get(`https://api.zahwazein.xyz/downloader/musically?apikey=${config.zenKey}&url=${arg}`)
        if ((!response.data.result.url_hd)) {
            await client.reply(from, `El enlace no es valido`, id)
        } else if (response.data.status == "OK") {
            await client.sendFileFromUrl(from, `${response.data.result.url_hd}`, "", "w", id)
        } else {
            await client.reply(from, `Ocurrio un error`, id)
        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "tiktok",
    aliases: 'tk',
    desc: 'Descarga algun tiktok sin marca de agua'
}