<<<<<<< Updated upstream
const axios = require('axios')
const { youtubeDl } = require('../lib/functions')

module.exports.run = async (client, message, args, config) => {
    const { id, from } = message
    const arg = args.join('')
    //const isUrl = arg.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
    const isUrl = arg.match(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/img)

    try {
        if (!arg) return await client.reply(from, `Envia el comando *${config.prefix}play [consulta/url]*`, id)
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
                    if (a <= 5 && rs.type == "video") {
                        txt += `
=======
const axios = require("axios");
const { ytSolver } = require("../lib/functions");
const yt = require("yt-converter");
const fs = require("fs");

module.exports.run = async (client, message, args, config) => {
  const { id, from } = message;
  const arg = args.join("");
  const isUrl = arg.match(
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gim
  );

  try {
    if (!arg)
      return await client.reply(
        from,
        `Envia el comando *${config.prefix}play [consulta/url]*`,
        id
      );
    await client.reply(from, `Espera un momento`, id);
    if (isUrl) {
      await ytSolver(arg).then((r) => {
        client.sendFileFromUrl(
          from,
          `${r.thumb}`,
          `a.jpg`,
          `Inicia la descarga de *${r.title}*\nCanal/Autor: ${r.author}`,
          id
        );
        yt.convertAudio(
          {
            url: args.join(""),
            itag: 140,
            directoryDownload: __dirname.replace("commands", "media/audio"),
            title: `${r.title}`,
          },
          function () {},
          function () {
            client.sendFileFromUrl(
              from,
              `./media/audio/${r.title}.mp3`,
              `${r.title}.mp3`,
              `w`,
              id
            );
            fs.unlink(`./media/audio/${r.title}.mp3`, function (e) {
              if (e) console.log(e);
            });
          }
        );
      });
    } else {
      const res = await axios.get(
        `https://api-fgmods.ddns.net/api/ytsearch?q=${args.join(" ")}&apikey=${
          config.fgmKey
        }`
      );
      let ytm = res.data.result;
      let rs;
      if (!ytm || ytm == undefined) {
        await client.reply(
          from,
          `No se encontraron resultados para tu busqueda`,
          id
        );
      } else {
        a = 1;
        txt = "     Resultados";
        ytm.forEach((rs) => {
          if (a <= 5 && rs.type == "video") {
            txt += `
>>>>>>> Stashed changes
${a}-. Titulo: ${rs.title}
Duracion: ${rs.timestamp}
Autor/Canal: ${rs.author.name}
`;
            a += 1;
          } else {
            return;
          }
        });

<<<<<<< Updated upstream
                await client.reply(from, txt += "\nResponde este mensaje con la opcion (numero) a descargar\nEl tiempo de espera es de solo un minuto", id)
                const filter = m => m.author === message.author && (m.quotedMsg ? m.quotedMsg.body : '').includes("Responde este mensaje")
                client.awaitMessages(from, filter, { max: 1, time: 60000, errors: ['time', 'max'] }).then(c => {
                    let d
                    c.forEach(r => {
                        d = r
                    });
                    if (!isNaN(d.body)) {
                        if (d.body > 5) {
                            client.reply(from, `El numero excede al de las opciones
Intenta de nuevo`)
                        } else {
                            rs = parseInt(d.body)
                            youtubeDl([ytm[rs - 1].url, config.fgmKey]).then(rss => {
                                if (rss == false) {
                                    client.reply(from, `El servicio no esta disponible`, id)
                                } else {
                                    client.sendFileFromUrl(from, `${rss.thumb}`, `a.jpg`, `Inicia la descarga de *${rss.title}*\nTamaño: ${rss.size}\nCanal/Autor: ${rss.channel}`, id)
                                    client.sendFileFromUrl(from, `${rss.result}`, `${rss.title}.mp3`, "", id)
                                }
                            })

                        }
                    } else {
                        client.reply(from, `No de admiten caracteres
Intenta de nuevo`)
=======
        await client.reply(
          from,
          (txt +=
            "\nResponde este mensaje con la opcion (numero) a descargar\nEl tiempo de espera es de solo un minuto"),
          id
        );
        const filter = (m) =>
          m.author === message.author &&
          (m.quotedMsg ? m.quotedMsg.body : "").includes(
            "Responde este mensaje"
          );
        client
          .awaitMessages(from, filter, {
            max: 1,
            time: 60000,
            errors: ["time", "max"],
          })
          .then((c) => {
            let d;
            c.forEach((r) => {
              d = r;
            });
            if (!isNaN(d.body)) {
              if (d.body > 5) {
                client.reply(
                  from,
                  `El numero excede al de las opciones
Intenta de nuevo`
                );
              } else {
                rs = parseInt(d.body);
                ytSolver(ytm[rs - 1].url).then((r) => {
                  client.sendFileFromUrl(
                    from,
                    `${r.thumb}`,
                    `a.jpg`,
                    `Inicia la descarga de *${r.title}*\nCanal/Autor: ${r.author}`,
                    id
                  );
                  yt.convertAudio(
                    {
                      url: ytm[rs - 1].url,
                      itag: 140,
                      directoryDownload: __dirname.replace(
                        "commands",
                        "media/audio"
                      ),
                      title: `${r.title}`,
                    },
                    function () {},
                    function () {
                      client.sendFileFromUrl(
                        from,
                        `./media/audio/${r.title}`,
                        `${r.title}`,
                        `w`,
                        id
                      );
                      fs.unlink(`./media/audio/${r.title}`, function (e) {
                        if (e) console.log(e);
                      });
>>>>>>> Stashed changes
                    }
                  );
                });
              }
            } else {
              client.reply(
                from,
                `No de admiten caracteres
Intenta de nuevo`
              );
            }
          })
          .catch((e) => {
            if (e.size == 0) {
              client.reply(
                from,
                `El tiempo se ha agotado
Intenta de nuevo`,
                id
              );
            }
          });
      }
    }
  } catch (e) {
    console.error(
      `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
      e.toString()
    );
    if (e.toString() == "Error: getaddrinfo ENOTFOUND api-fgmods.ddns.net") {
      await client.reply(
        from,
        `El servicio de busqueda no esta disponble
Intenta introducir el enlace`,
        id
      );
    } else {
      await client.reply(from, `Ocurrio un error`, id);
    }
  }
  await client.simulateTyping(from, false);
};

module.exports.config = {
  name: "play",
  aliases: "p",
  desc: "Descarga una cancion",
};
