const axios = require("axios")
const p = require("phin")
const { getBuffer, uploadImage } = require("../lib/functions");
module.exports.run = async(client, message, args, config) => {
    const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
    try {
        if (!args) return await client.reply(from, `Envia el comando *${prefix}telest [url], la url debe ser directo al paquete de stickers. \nEs recomendable no usar el comando en grupos, para evitar spam`, id)

        var axios = require("axios").default;

        var options = {
            method: 'GET',
            url: 'https://instagram29.p.rapidapi.com/media/CAieZkXgcky',
            headers: {
                'x-rapidapi-host': 'instagram29.p.rapidapi.com',
                'x-rapidapi-key': 'SIGN-UP-FOR-KEY'
            }
        };
        client.
        axios.request(options).then(function(response) {
            console.log(response.data);
        }).catch(function(error) {
            console.error(error);
        });
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "igdl",
    aliases: 'id',
    desc: 'nose'
}