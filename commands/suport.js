module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    try {
        await client.reply(from, `Para resolver tus dudas sobre el desarrollo del bot, puedes contactarme aqui:
WhatsApp: wa.me/525633592644
Discord: Cyopn#7302`, id)

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