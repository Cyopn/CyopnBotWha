const fs = require('fs-extra')
const { prefix } = require("../config.json")
const db = require('megadb')
let dBase = new db.crearDB({
    nombre: 'dataDesc',
    carpeta: './database'
})

module.exports = welcome = async(client, event) => {
    const gChat = await client.getChatById(event.chat)
    const { contact, groupMetadata, name } = gChat
    const groupId = groupMetadata.id

    if (!dBase.has(groupId)) {
        dBase.set(groupId, {
            welcome: 'No',
            nsfw: 'No'
        })
    }
    const res = await dBase.get(groupId)

    try {
        if (res.welcome === 'Si' && event.action == 'add') {
            const pepe = await client.getProfilePicFromServer(event.who)
            const capt = `Hola @${contact.replace('@c.us', '')}, Bienvenido a *${name}*, esperaoms te diviertas aqui, usa ${prefix}help para ver los comandos`
            if (pepe == '' || pepe == undefined) {
                await client.sendFileFromUrl(event.chat, 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU', 'profile.jpg', capt)
            } else {
                await client.sendFileFromUrl(event.chat, pepe, 'profile.jpg', capt)
            }
        } else {
            return
        }
    } catch (e) {
        console.error(e)
    }
}