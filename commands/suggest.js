const db = require("megadb")
const ss = new db.crearDB({
    nombre: 'dataSuggest',
    carpeta: './database'
})

module.exports.run = async (client, message, args, config) => {
    const { from, author, isGroupMsg, chat, id } = message
    const sid = isGroupMsg ? author.replace('@c.us', '') : from.replace('@c.us', '')
    const groupId = isGroupMsg ? chat.groupMetadata.id.replace('@g.us', '') : sid
    let arg = args.join(' ')
    try {
        if (!arg) {
            await client.reply(from, `Escribe tu sugerencia`, id)
        } else {
            await ss.set(`${groupId}.${sid}-${new Date().getDate()}/${new Date().getUTCMonth() + 1}/${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`, {
                isGroup: isGroupMsg,
                suggestion: arg
            })
            await client.reply(from, `Gracias por tu sugerencia`, id)
        }

    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "suggest",
    aliases: 'sg',
    desc: 'Envia una sugerencia para el desarrollo del bot'
}