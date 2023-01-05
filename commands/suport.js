module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    try {
        const vcard = 'BEGIN:VCARD\n' +
            'VERSION:3.0\n' +
            'FN:Cyopn\n' +
            'ORG:Cyopn;\n' +
            'TEL;type=CELL;type=VOICE;waid=525627127780:+525627127780\n' +
            'END:VCARD'
        await client.sendVCard(from, vcard, `Cyopn`, `525627127780`)
        await client.reply(from, 'Aquí está el número del creador del bot\nAqui puedes resolver tus preguntas y errores', id)

    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "suport",
    aliases: 'sp',
    desc: 'Obten ayuda si existe algun problema'
}