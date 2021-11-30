const fs = require('fs')
let command = []
let alias = []
let desc = []
let txt = ""

txt = txt.replace(txt, "")
let path

module.exports.run = async(client, message, args, config) => {
    let { from, id } = message
    const { prefix } = config

    try {
        path=`     〘 *CyopnBot* 〙
*Informacion*
prefijo: [ ${prefix} ]
Creador: Cyopn
Instagram: https://instagram.com/Cyopn_/

Comandos: 
 
act (alias: ac)
Activa algunas funciones(bienvebida/nsfw)

covid (alias: cd)
Obten informacion sobre el covid-19 en tu pais

deact (alias: dc)
Desactiva algunas funciones(bienvebida/nsfw)

groupinfo (alias: ginfo)
Obten informacion sobre el grupo

level (alias: lvl)
Obten informacion sobre tu nivel y xp

math (alias: mt)
Resuelve problemas, operaciones aritmeticas: !math sim [operacion], pronto mas opciones

meme (alias: m)
Momazos en r/ChingaTuMadreNoko

play (alias: p)
Descarga una cancion

stext (alias: st)
Crea un sticker a partir de texto

sticker (alias: s)
Crea stickers

stickergif (alias: sg)
Crea un sticker en movimiento

suport (alias: sp)
Obten ayuda si existe algun problema

toimg (alias: ti)
Convierte un sticker a imagen

tts (alias: tts)
Envia audios en un lenguaje especifico`
        /*fs.readdir('./commands/', (err, files) => {

            if (err) return console.error(err)
            let jsfile = files.filter(f => f.split(".").pop() === "js")
            if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
            jsfile.forEach((f, i) => {

                let pull = require(`./${f}`)
                command.push(pull.config.name)
                alias.push(pull.config.aliases)
                desc.push(pull.config.desc)
            });

            txt = `     〘 *CyopnBot* 〙
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
        })*/
        
        await client.reply(from, path, id)
    } catch (e) {
        console.error(e)
    }
}

module.exports.config = {
    name: "help",
    aliases: 'h',
    desc: 'nada'
}