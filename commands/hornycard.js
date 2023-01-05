const {getBuffer, uploadImage}=require("../lib/functions")
module.exports.run = async(client, message, args, config) => {
    const { id, from, author, quotedMsg, mentionedJidList } = message

    try {
        let who=quotedMsg?quotedMsg.author.replace('@c.us', ''):mentionedJidList && mentionedJidList[0]?mentionedJidList[0].replace('@c.us', ''):author.replace('@c.us', '')
        
        let pic=await client.getProfilePicFromServer(who.concat('@c.us'))
        let psend=pic && !pic.includes("ERROR") ? pic : 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
        const rs=await getBuffer(psend)
        let up=await uploadImage(rs)
        await client.sendFile(from, `https://some-random-api.ml/canvas/horny?avatar=${up}`, 'yo.png', '', id)
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "hornycard",
    aliases: 'hcd',
    desc: 'nose'
}


