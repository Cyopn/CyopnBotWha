module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    const { prefix } = config
    try {
        if (!args) return client.reply(from, `Escribe *${prefix}tts [idioma] [texto]*, usa ${prefix}idioma para ver los idiomas disponibles \nAsegurate escribirlos bien!`)
        const arg = args.shift()
        const ttsGB = require('node-gtts')(arg)
        const dataText = args.join(' ')
        if (!dataText) return client.reply(from, `Escribe *${prefix}tts [idioma] [texto], ejemplo: ${prefix}tts es hola`, id)
        ttsGB.save('./media/audio/tts.mp3', dataText, function() {
            client.sendPtt(from, './media/audio/tts.mp3', id);
        })
    } catch (e) {
        let er = e.toString()
        let a = er.split(" ").pop()
        if (er.includes('Error: Language not supported:')) {
            await client.reply(from, `El idioma ${a} no existe, intenta de nuevo, escribe *${prefix}tts [idioma] [texto]*
            Escribe ${prefix}lang para ver los idiomas`, id)
        } else {
            await client.reply(from, `Ocurrio un error`, id)
            console.error(e)
        }
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "tts",
    aliases: 'tts',
    desc: 'Envia audios en un lenguaje especifico'
}