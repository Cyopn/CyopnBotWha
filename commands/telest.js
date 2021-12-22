const axios=require("axios")
module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    const { prefix, zeeksKey }=config
    try {
        if(!args)return await client.reply(from, `Envia el comando *${prefix}telest [url], la url debe ser directo al paquete de stickers. \nEs recomendable no usar el comando en grupos, para evitar spam`, id)
        
        const response=await axios.get(`https://api.zeks.me/api/telegram-sticker?apikey=${zeeksKey}&url=${args.join("")}`)
        const res=response.data.result
        
        if(res===undefined){
            await client.reply(from, `Ha ocurrido un error, asegurate que el paquetede stickers NO sean animados`, id)
        }
        
        
    } catch (e) {
        console.error(e)
        await client.reply(from, `Ocurrio un error`, id)
    }
}
module.exports.config = {
    name: "telest",
    aliases: 'tst',
    desc: 'Obten stickers de Telegram solo con su enlace directo, no disponible con stickers animados'
}