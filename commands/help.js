const {loadCommands}=require("../lib/functions")
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