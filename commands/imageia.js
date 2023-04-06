const { Configuration, OpenAIApi } = require("openai");
const translate = require("translate-google");

module.exports.run = async (client, message, args, config) => {
<<<<<<< Updated upstream
    const { from, id } = message
    const { opentk } = config
    const configuration = new Configuration({
        apiKey: opentk,
    });
    const openai = new OpenAIApi(configuration);
    await openai.createImage({
        prompt: args.join(" "),
        n: 1,
        size: "1024x1024",
    }).then(r => {
        let image_url = r.data.data[0].url;
        client.sendFileFromUrl(from, image_url, "", "w", id)
    }).catch(e => {
        console.log(e.response.data.error.message)
        if (e.response.data.error.message) {
            if (e.response.data.error.message.includes("Billing hard limit has been reached")) {
                client.reply(from, `Se ha alcanzado el limite de solicitudes
Se reinicia cada dia despues de las 4:00 am hora México`, id)
            } else {
                translate(e.response.data.error.message, { to: 'es' }).then(res => {
                    client.reply(from, res, id)
                }).catch(err => {
                    console.error(err)
                })
            }
        } else {
=======
  const { from, id } = message;
  client.reply(
    from,
    `Se ha alcanzado el limite de solicitudes
Por ahora no estara disponible hasta nuevo aviso`,
    id
  );
  if (!args)
    return await client.reply(
      from,
      `Envia el comando *${config.prefix}imageia [Consulta]*`,
      id
    );
>>>>>>> Stashed changes

  const { opentk } = config;
  const configuration = new Configuration({
    apiKey: opentk,
  });
  const openai = new OpenAIApi(configuration);
  await openai
    .createImage({
      prompt: args.join(" "),
      n: 1,
      size: "1024x1024",
    })
    .then((r) => {
      let image_url = r.data.data[0].url;
      client.sendFileFromUrl(from, image_url, "", "w", id);
    })
    .catch((e) => {
      console.error(
        `Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
        e
      );
      client.reply(
        from,
        `Se ha alcanzado el limite de solicitudes
Por ahora no estara disponible hasta nuevo aviso`,
        id
      );
      /* if (e.response.data.error.message) {
        console.log(e.response.data.error.message);
        if (
          e.response.data.error.message.includes(
            "Billing hard limit has been reached"
          )
        ) {
          client.reply(
            from,
            `Se ha alcanzado el limite de solicitudes
Por ahora no estara disponible hasta nuevo aviso`,
            id
          );
        } else {
          translate(e.response.data.error.message, { to: "es" })
            .then((res) => {
              client.reply(from, res, id);
            })
            .catch((err) => {
              console.error(err);
            });
        }
<<<<<<< Updated upstream
    })
    await client.simulateTyping(from, false)
}
=======
      } else {
      } */
    });
  await client.simulateTyping(from, false);
};
>>>>>>> Stashed changes

module.exports.config = {
  name: "imageia",
  aliases: "ima",
  desc: "Genera imagenes con inteligencia artificial",
};
