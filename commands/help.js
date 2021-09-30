const fs = require('fs')
var command = []
var alias = []
var desc = []

module.exports.run = async(client, message, args, config) => {
    var { from, id } = message
    const { prefix } = config

    try {
        fs.readdir('./commands/', (err, files) => {

            if (err) return console.error(err)
            let jsfile = files.filter(f => f.split(".").pop() === "js")
            if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
            jsfile.forEach((f, i) => {

                let pull = require(`./${f}`)
                command.push(pull.config.name)
                alias.push(pull.config.aliases)
                desc.push(pull.config.desc)
            });

            var txt = `     〘 *CyopnBot* 〙
*Informacion*
prefijo: [ ${prefix} ]
Creador: Cyopn
Instagram: https://instagram.com/Cyopn_/

Comandos: 
`
            command.forEach((name) => {
                if (name === 'help') return
                const sr = command.indexOf(name)
                txt += `${name} (alias: ${alias[sr]})\n${desc[sr]}

`
            })
            client.reply(from, txt, id)
        })
    } catch (e) {
        console.error(e)
    }
}

module.exports.config = {
    name: "help",
    aliases: 'h',
    desc: 'nada'
}