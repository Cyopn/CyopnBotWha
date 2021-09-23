const db = require('megadb')
const lvldB = new db.crearDB({
    nombre: 'dataLevel',
    carpeta: './database'
})

module.exports = {
    lvlFunc: async(client, message) => {
        const { type, id, from, t, sender, author, isGroupMsg, chat, body } = message
        const groupId = isGroupMsg ? chat.groupMetadata.id.replace('@g.us', '') : ''
        const sid = author.replace('@c.us', '')

        if (message.fromMe) return;
        if (lvldB.has(groupId) && lvldB.has(`${groupId}.${sid}`)) {

            let { xp, level } = await lvldB.get(`${groupId}.${sid}`)

            const sxp = body.length / 2
            let lvlup = 5 * (level ** 2) + 50 * level + 100

            if ((xp + sxp) >= lvlup) {
                lvldB.set(`${groupId}.${sid}`, {
                    xp: 0,
                    level: parseInt(level) + 1
                })

                client.sendTextWithMentions(from, `Felicidades @${sid} has avanzado de nivel \nSigue asi!`)
            } else {
                lvldB.add(`${groupId}.${sid}.xp`, sxp)
            }
        } else {
            lvldB.set(`${groupId}.${sid}`, {
                xp: 0,
                level: 1
            })
        }
    }
}