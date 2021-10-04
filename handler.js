const fs = require('fs')
var command = []
var alias = []
const config = require('./config.json')

fs.readdir('./commands/', (err, files) => {

    if (err) return console.error(err)
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
    jsfile.forEach((f, i) => {
        let pull = require(`./commands/${f}`)
        command.push(pull.config.name)
        alias.push(pull.config.aliases)
    });
    console.log(`Se cargaron ${command.length} comandos, de ${files.length} archivos`)
})

module.exports = msgHandler = async(client, message) => {
    const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
    let { body } = message
    var { name, formattedTitle } = chat
    let { pushname, verifiedName, formattedName } = sender
    pushname = pushname || verifiedName || formattedName
    body = (type === 'chat' && body.startsWith(config.prefix)) ? body : ((type === 'image' && caption || type === 'video' && caption) && caption.startsWith(config.prefix)) ? caption : ''
    try {
        const { lvlFunc } = require('./lib/level')
        await lvlFunc(client, message)

        if (body.startsWith(config.prefix)) {
            const args = body.slice(config.prefix.length).trim().split(' ')
            var comm
            if (!args) {
                comm = body
            } else {
                comm = args.shift().toLowerCase()
            }
            const sr = command.indexOf(comm) === -1 ? alias.indexOf(comm) : command.indexOf(comm)
            const commFil = command[sr]
            if (commFil === undefined || args.join('') === 'null') return
            const commFile = require(`./commands/${commFil}`)
            commFile.run(client, message, args, config)
        } else {
            return
        }

    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}