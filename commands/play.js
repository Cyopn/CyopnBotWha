const axios = require('axios')
const { youtubeDl } = require('../lib/functions')

module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    const arg = args.join('')
    //const isUrl = arg.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
    const isUrl = arg.match(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/img)

    try {
        if (!arg) return await client.reply(from, `Envia el comando *${prefix}play [consulta/url]*`, id)
        await client.reply(from, `Espera un momento`, id)
        if (isUrl) {
            let r = await youtubeDl([arg, config.fgmKey])
            if (r == false) {
                await client.reply(from, `El servicio no esta disponible`, id)
            } else {
                await client.sendFileFromUrl(from, `${r.thumb}`, `a.jpg`, `Inicia la descarga de *${r.title}*\nTamaño: ${r.size}\nCanal/Autor: ${r.channel}`, id)
                await client.sendFileFromUrl(from, `${r.result}`, `${r.title}.mp3`, "", id)
            }
        } else {
            const res = await axios.get(`https://api-fgmods.ddns.net/api/ytsearch?q=${args.join(" ")}&apikey=${config.fgmKey}`)
            let ytm = res.data.result
            let rs
            if (!ytm || ytm == undefined) {
                await client.reply(from, `No se encontraron resultados para tu busqueda`, id)
            } else {
                a = 1
                txt = "     Resultados"
                ytm.forEach(rs => {
                    if (a <= 10 && rs.type == "video") {
                        txt += `
${a}-. Titulo: ${rs.title}
Duracion: ${rs.timestamp}
Autor/Canal: ${rs.author.name}
`
                        a += 1
                    } else {
                        return
                    }
                });

                await client.reply(from, txt += "Responde este mensaje con la opcion a descargar\nEl tiempo de espera es de solo un minuto", id)
                const filter = message => message.author
                client.awaitMessages(from, filter, { max: 1, time: 60000, errors: ['time', 'max'] }).then(c => {
                    let d
                    c.forEach(r => {
                        d = r
                    });
                    if (d.quotedMsg == null) {
                        client.reply(from, `Debes reponder al mensaje indicado
Intenta de nuevo`, id)
                    } else {
                        if (d.quotedMsg.body.includes("Responde este mensaje con la opcion a descargar")) {
                            if (!isNaN(d.body)) {
                                if (d.body > 10) {
                                    client.reply(from, `El numero excede al de las opciones
Intenta de nuevo`)
                                } else {
                                    rs = parseInt(d.body)
                                    youtubeDl([ytm[rs-1].url, config.fgmKey]).then(rss => {
                                        if (rss == false) {
                                            client.reply(from, `El servicio no esta disponible`, id)
                                        } else {
                                            client.sendFileFromUrl(from, `${rss.thumb}`, `a.jpg`, `Inicia la descarga de *${rss.title}*\nTamaño: ${rss.size}\nCanal/Autor: ${rss.channel}`, id)
                                            client.sendFileFromUrl(from, `${rss.result}`, `${rss.title}.mp3`, "", id)
                                        }
                                     })

                                }
                            } else {
                                console.log("w")
                                client.reply(from, `No de admiten caracteres
Intenta de nuevo`)
                            }
                        } else {
                            client.reply(from, `Debes reponder al mensaje indicado
Intenta de nuevo`, id)
                        }
                    }
                }).catch(e => {
                    console.log(e)
                })
            }
        }
    } catch (e) {
        console.error(e.toString())
        await client.reply(from, `Ocurrio un error`, id)

    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "play",
    aliases: 'p',
    desc: 'Descarga una cancion'
}