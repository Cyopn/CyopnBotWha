const { Configuration, OpenAIApi } = require("openai");
const translate = require("translate-google");

module.exports.run = async (client, message, args, config) => {
	const { from, id } = message;
	if (!args)
		return await client.reply(
			from,
			`Envia el comando *${config.prefix}imageia [Consulta]*`,
			id
		);

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
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
				e.toString()
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
    })
    await client.simulateTyping(from, false)
}
      } else {
      } */
		});
	await client.simulateTyping(from, false);
};
module.exports.config = {
	name: "imageia",
	alias: "ima",
	desc: "Genera imagenes con inteligencia artificial",
};
