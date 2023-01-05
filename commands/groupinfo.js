const db = require('megadb')
let dBase = new db.crearDB({
    nombre: 'dataDesc',
    carpeta: './database'
})

module.exports.run = async(client, message, args, config) => {
    const { id, from, isGroupMsg, chat } = message
    let { name } = chat

    try {
        if (!isGroupMsg) return client.reply(from, 'Comando solo disponible para grupos', id)
        let totalMem = chat.groupMetadata.participants.length
        let des = chat.groupMetadata.desc
        let desc = des === undefined ? 'Sin descripcion' : des
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        if (!dBase.has(groupId)) {
            dBase.set(groupId, {
                welcome: 'No',
                nsfw: 'No'
            })
        }
        const res = await dBase.get(groupId)
        let grouppic = await client.getProfilePicFromServer(chat.id)
        if (grouppic === undefined) {
            await client.reply(from, `*${name}* 

*Miembros: ${totalMem}*
*Bienbenida: ${res.welcome}*
*NSFW: ${res.nsfw}*

*Descripcion* 
${desc}`, id)

        } else {
            let pfp = grouppic
            await client.sendFileFromUrl(from, pfp, 'group.png', `*${name}* 
            
*Miembros: ${totalMem}*
*Bienbenida: ${res.welcome}*
*NSFW: ${res.nsfw}*

*Descripcion* 
${desc}`)

        }
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "groupinfo",
    aliases: 'ginfo',
    desc: 'Obten informacion sobre el grupo'
}