const db = require('megadb')
let dBase = new db.crearDB({
    nombre: 'dataDesc',
    carpeta: './database'
})

module.exports.run = async(client, message, args, config) => {
    const { id, from, sender, isGroupMsg, chat } = message
    const groupId = isGroupMsg ? chat.groupMetadata.id : ''
    const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
    const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false

    try {
        if (!isGroupMsg) return client.reply(from, 'Comando solo disponible en grupos', id)
        if (!isGroupAdmins) return client.reply(from, 'Necesitas ser administrador para usar este comando', id)
        const opt = args.join('')
        if (!dBase.has(groupId)) {
            dBase.set(groupId, {
                welcome: 'No',
                nsfw: 'No'
            })
        }
        switch (opt) {
            case 'welcome':
                const res = await dBase.get(groupId)
                if (res.welcome === 'Si') {
                    client.reply(from, 'La bienvenida ya esta activada', id)
                } else {
                    let ns = res.nsfw === 'No' ? 'No' : 'Si'
                    dBase.set(groupId, {
                        welcome: 'Si',
                        nsfw: ns
                    })
                    client.reply(from, 'Se activo con exito la bienvenida', id)
                }
                break

            case 'nsfw':
                const resn = await dBase.get(groupId)
                if (resn.nsfw === 'Si') {
                    client.reply(from, 'El nsfw ya esta activado', id)
                } else {
                    let wel = resn.welcome === 'No' ? 'No' : 'Si'
                    dBase.set(groupId, {
                        welcome: wel,
                        nsfw: 'Si'
                    })
                    client.reply(from, 'Se activo con exito el nsfw', id)
                }
                break

            default:
                client.reply(from, `Opcion no disponible o no existe`, id)
                break
        }
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "act",
    aliases: 'ac',
    desc: 'Activa algunas funciones(bienvebida/nsfw)'
}