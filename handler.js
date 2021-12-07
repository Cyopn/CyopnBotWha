const fs = require('fs')
let command = []
let alias = []
const config = require('./config.json')

fs.readdir('./commands/', (err, files) => {

    if (err) return console.error(err)
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
    jsfile.forEach((f) => {
        let pull = require(`./commands/${f}`)
        command.push(pull.config.name)
        alias.push(pull.config.aliases)
    });
})

module.exports = msgHandler = async(client, message) => {
    const { type, id, from, caption } = message
    let { body } = message
    body = (type === 'chat' && body.startsWith(config.prefix)) ? body : ((type === 'image' && caption || type === 'video' && caption) && caption.startsWith(config.prefix)) ? caption : ''
    
    try {
        /*const { lvlFunc } = require('./lib/level')
        await lvlFunc(client, message)*/
        if (body.startsWith(config.prefix)) {
            const args = body.slice(config.prefix.length).trim().split(' ')
            const comm = args.shift().toLowerCase()
            const sr = command.indexOf(comm) === -1 ? alias.indexOf(comm) : command.indexOf(comm)
            if (sr === -1) return
            const commFil = command[sr]
            const commFile = require(`./commands/${commFil}`)
            commFile.run(client, message, args, config)
        }

    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}