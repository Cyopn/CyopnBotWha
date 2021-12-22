const google = require("google-it")
const fetch = require("node-fetch")
module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    let arg = args.join(' ')
    try {
        if (!arg) return await client.reply(from, `Envia tu consulta con el comando *${prefix}search [consulta]*, ejemplo : ${prefix}search Cyopn`, id)

        let url = `https://google.com/search?q=${encodeURIComponent(arg)}`
        let search = await google({ query: arg })
        let txt = search.map(({ title, link, snippet }) => {
            return `*${title}*\n_${link}_\n_${snippet}_`
        }).join('\n\n')

        await client.sendFile(from, `https://nurutomo.herokuapp.com/api/ssweb?url=${url}&full=false&delay=1&type=jpeg`, 'screenshot.png', `Resultados para *${arg}* \n\n${txt}`, id)
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "search",
    aliases: 'sr',
    desc: 'Haz una busqueda en Google'
}