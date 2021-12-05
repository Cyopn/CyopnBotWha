const google=require("google-it")
module.exports.run = async(client, message, args, config) => {
    const { type, id, from, t, sender, author, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
    let { body } = message
    let { name, formattedTitle } = chat
    let { pushname, verifiedName, formattedName } = sender
    pushname = pushname || verifiedName || formattedName
    let arg=args.join(' ')
    try {
        if(!args) return await client.reply(from, `Envia tu consulta con el comando *${prefix}search [consulta]*, ejemplo : ${prefix}search Cyopn`)
        
        let search=await google({query:arg})
        let txt=search.map(({title, link, snippet})=>{
            return `*${title}*\n_${link}_\n_${snippet}_`
        }).join('\n\n')
        
        
        /*await client.sendFile(from, ss, 'screenshot.png', `${url}\n\n${txt}`, id)*/
        await client.reply(from, `Resultados para *${arg}* \n\n${txt}`, id)
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "search",
    aliases: 'sr',
    desc: 'Haz una busqueda en Google'
}