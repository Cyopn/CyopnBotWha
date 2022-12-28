const axios = require("axios").default
module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    let arg = args.join('')
    try {
        if (!arg) return await client.reply(from, `Envia tu consulta con el comando *${prefix}tiktok [url]*, ejemplo : ${prefix}search https://vm.tiktok.com/ZM8KHKpUv`, id)
        await client.reply(from, `Espera un poco`, id)

        let response = await axios.get(`https://zenzapis.xyz/downloader/musically?apikey=212ce9335d&url=${arg}`)
        if ((!response.data.result.url_hd)) {
            await client.reply(from, `El enlace no es valido`, id)
        } else if (response.data.status == "OK") {
            await client.sendFileFromUrl(from, `${response.data.result.url_hd}`, "w.mp4", "holis bonis", id)
        } else {
            await client.reply(from, `Ocurrio un error`, id)
        }

    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "tiktok",
    aliases: 'tk',
    desc: 'Descarga algun tiktok sin marca de agua'
}