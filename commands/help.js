const {loadCommands}=require("../lib/functions")
let txt = ""

txt = txt.replace(txt, "")
let path

module.exports.run = async(client, message, args, config) => {
    let { from, id } = message
    const { prefix } = config
    let pathh="nose"
    try {
        path=`     〘 *CyopnBot* 〙
*Informacion*
*Prefijo*: [ ${prefix} ]
*Creador*: Cyopn
*Instagram*: https://instagram.com/Cyopn_/

*Comandos*: 
 
*Act* (alias: ac)
_Activa algunas funciones(bienvebida/nsfw)._

*Covid* (alias: cd)
_Obten informacion sobre el covid-19 en tu pais._

*Deact* (alias: dc)
_Desactiva algunas funciones(bienvebida/nsfw)._

*Groupinfo* (alias: ginfo)
_Obten informacion sobre el grupo._

*Level* (alias: lvl)
_Obten informacion sobre tu nivel y xp._

*Math* (alias: mt)
_Resuelve problemas, operaciones aritmeticas: !math sim [operacion], pronto mas opciones._

*Meme* (alias: m)
_Momazos en r/ChingaTuMadreNoko._

*Play* (alias: p)
_Descarga una cancion._

*Stext* (alias: st)
_Crea un sticker a partir de texto._

*Sticker* (alias: s)
_Crea stickers._

*Stickergif* (alias: sg)
_Crea un sticker en movimiento._

*Suport* (alias: sp)
_Obten ayuda si existe algun problema._

*Toimg* (alias: ti)
_Convierte un sticker a imagen._

*Tts* (alias: tts)
_Envia audios en un lenguaje especifico._

*Search* (alias: sr)
_Realiza una busqueda en Google._

*Hornycard* (alias: hcd)
_Crea tu permiso para estar "horny"._`
        
        await client.reply(from, pathh, id)
    } catch (e) {
        console.error(e)
    }
}

module.exports.config = {
    name: "help",
    aliases: 'h',
    desc: 'nada'
}