const fbdown = require('fbdown')
module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    const { prefix } = config

    await client.reply(from, `Espera un poco`, id)
    if (!args.join("")) {
        await client.reply(from, `Usa *${prefix}fbdl [enlace]*`, id)
    } else {
        const arg = args[0]
        const isUrl = arg.match(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)
        if (isUrl) {
            const res = await fbdown(arg)
            if (res.includes("Error establishing a database connection")) return client.reply(from, `No se pudo establecer conexion con el servidor
Intenta mas tarde`, id)
            if (res.medias === undefined) return client.reply(from, `El enlace no es valido`, id)
            if (res.medias[1] != undefined) {
                await client.sendFile(from, res.medias[1].url, "nose", `w`, id).catch(e => {
                    if (e.toString().includes("Error: Evaluation failed: Error: MediaFileTooLarge:")) {
                        client.sendFile(from, res.medias[0].url, "nose", `w`, id).catch(e => {
                            console.log(e)
                        })
                    } else {
                        console.log(e.toString())
                        client.reply(from, `Es imposible enviar el video`, id)
                    }
                })
            } else if (res.medias[1] === undefined && res.medias[0].url != undefined) {
                await client.sendFile(from, res.medias[0].url, "nose", `w`, id).catch(e => {
                    if (e.toString().includes("Error: Evaluation failed: Error: MediaFileTooLarge:")) {
                        client.sendFile(from, res.medias[0].url, "nose", `w`, id).catch(e => {
                            console.log(e.toString())
                            client.reply(from, `Es imposible enviar el video`, id)
                        })
                    }
                })
            } else {
                client.reply(from, `EL video fue eliminado o es privado`, id)
            }
        } else {
            await client.reply(from, `El enlace no es valido`, id)
        }
    }

    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "fbdownload",
    aliases: 'fbdl',
    desc: 'Obtién multimedia de una publicacion de facebook'
}