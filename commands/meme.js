const utf = require("utf8")
const ex = require("child_process").execSync
const { loadJson } = require("../lib/functions")

module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    try {
        const rs = ex(`python ./lib/python/meme.py`, { encoding: "utf8" })

        loadJson().then(a => {
            client.sendFileFromUrl(from, a.url, 'yo.jpg', `${a.title}
Publicado por u/${a.author}`, id)

        })
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "meme",
    aliases: 'm',
    desc: 'Momazos en r/ChingaTuMadreNoko'
}