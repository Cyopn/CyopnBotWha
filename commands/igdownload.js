const igd = require('fg-ig')
module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    const { prefix } = config
    try {
        if (!args) {
            await client.reply(from, `Usa *${prefix}igdl [enlace]*`, id)
        } else {
            let res = await igd(args.join())

            res.url_list.forEach(r => {
                client.sendFile(from, r, "nose", `w`, id)
            });
        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "igdownload",
    aliases: 'igdl',
    desc: 'Obtién multimedia de una publicacion de instagram'
}