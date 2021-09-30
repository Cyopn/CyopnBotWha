const { getRed } = require('../lib/functions')
const axios = require('axios')

module.exports.run = async(client, message, args, config) => {
    const { id, from } = message

    try {
        const urlRed = await getRed('ChingaTuMadreNoko')
        const { subreddit, title, url, author } = urlRed.data
        client.sendFileFromUrl(from, url, 'yo.jpg', `${title}\nPost en r/${subreddit} de ${author}`, id)
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "meme",
    aliases: 'm',
    desc: 'Momazos en r/ChingaTuMadreNoko'
}