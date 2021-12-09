const db = require('megadb')
const lvldB = new db.crearDB({
    nombre: 'dataLevel',
    carpeta: './database'
})

module.exports = {
    lvlFunc: async(client, message) => {
        const { from, sender, author, isGroupMsg, chat, body } = message
        if (!isGroupMsg) return
        const groupId = isGroupMsg ? chat.groupMetadata.id.replace('@g.us', '') : ''
        const sid = author.replace('@c.us', '')
        if (message.fromMe || message.isMedia || message.type === 'image' || message.type === 'sticker' || message.type === 'ptt') return;

        if (lvldB.has(groupId) && lvldB.has(`${groupId}.${sid}`)) {

            let { xp, level } = await lvldB.get(`${groupId}.${sid}`)

            const sxp = body.length / 2
            let lvlup = 5 * (level ** 2) + 50 * level + 100

            if ((xp + sxp) >= lvlup) {
                lvldB.set(`${groupId}.${sid}`, {
                    xp: 0,
                    level: parseInt(level) + 1
                })

                await client.sendTextWithMentions(from, `Felicidades @${sender.id} has avanzado de nivel \nSigue asi!`)
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