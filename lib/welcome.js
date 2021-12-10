const fs = require('fs-extra')
const { prefix } = require("../config.json")
const db = require('megadb')
let dBase = new db.crearDB({
    nombre: 'dataDesc',
    carpeta: './database'
})

module.exports = welcome = async(client, event) => {
    const gChat = await client.getChatById(event.chat)
    const { groupMetadata, name } = gChat
    const groupId = groupMetadata.id

    if (!dBase.has(groupId)) {
        dBase.set(groupId, {
            welcome: 'No',
            nsfw: 'No'
        })
    }
    const res = await dBase.get(groupId)

    try {
        if (res.welcome === 'Si' && event.action === 'add') {
            const pep = await client.getProfilePicFromServer(event.who)
            const capt = `Hola @${event.who.replace('@c.us', '')}, Bienvenido a *${name}*, esperamos te diviertas aqui, usa ${prefix}help para ver los comandos`
            let ps=pep && !pep.includes("ERROR") ? pep : 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                await client.sendFileFromUrl(event.chat, ps, 'profile.jpg', capt)
            
        }
    } catch (e) {
        console.error(e)
    }
}