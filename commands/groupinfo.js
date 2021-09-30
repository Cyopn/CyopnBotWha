const fs = require('fs')
const db = require('megadb')
let dBase = new db.crearDB({
    nombre: 'dataDesc',
    carpeta: './configdata'
})

module.exports.run = async(client, message, args, config) => {
    const { id, from, isGroupMsg, chat } = message
    var { name } = chat

    try {
        if (!isGroupMsg) return client.reply(from, 'Comando solo disponible para grupos', id)
        var totalMem = chat.groupMetadata.participants.length
        var des = chat.groupMetadata.desc
        var desc = des === undefined ? 'Sin descripcion' : des
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        if (!dBase.has(groupId)) {
            dBase.set(groupId, {
                welcome: 'No',
                nsfw: 'No'
            })
        }
        const res = await dBase.get(groupId)
        var grouppic = await client.getProfilePicFromServer(chat.id)
        if (grouppic == undefined) {
            await client.reply(from, `*${name}* 

*Miembros: ${totalMem}*
*Bienbenida: ${res.welcome}*
*NSFW: ${res.nsfw}*

*Descripcion* 
${desc}`, id)

        } else {
            var pfp = grouppic
            await client.sendFileFromUrl(from, pfp, 'group.png', `*${name}* 
            
*Miembros: ${totalMem}*
*Bienbenida: ${res.welcome}*
*NSFW: ${res.nsfw}*

*Descripcion* 
${desc}`)

        }
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "groupinfo",
    aliases: 'ginfo',
    desc: 'Obten informacion sobre el grupo'
}