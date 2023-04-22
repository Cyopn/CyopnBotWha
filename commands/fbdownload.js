const fbdown = require("fbdown");
module.exports.run = async (client, message, args, config) => {
	const { id, from } = message;
	const { prefix } = config;

	await client.reply(from, `Espera un poco`, id);
	if (!args.join("")) {
		await client.reply(from, `Usa *${prefix}fbdl [enlace]*`, id);
	} else {
		const arg = args[0];
		const isUrl = arg.match(/www.facebook.com|fb.watch/g);
		if (isUrl) {
			const res = await fbdown(arg);
			if (res.url === undefined)
				return client.reply(from, `El enlace no es valido`, id);
			if (res.url[0] != undefined) {
				await client
					.sendFile(from, res.url[0].url, "nose", `w`, id)
					.catch((e) => {
						if (
							e
								.toString()
								.includes(
									"Error: Evaluation failed: Error: MediaFileTooLarge:"
								)
						) {
							client
								.sendFile(from, res.url[1].url, "nose", `w`, id)
								.catch((e) => {
									console.error(
										`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
										e.toString()
									);
									client.reply(
										from,
										`Es imposible enviar el video`,
										id
									);
								});
						} else {
							console.error(
								`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
								e.toString()
							);
							client.reply(
								from,
								`Es imposible enviar el video`,
								id
							);
						}
					});
			} else {
				client.reply(from, `EL video fue eliminado o es privado`, id);
			}
		} else {
			await client.reply(from, `El enlace no es valido`, id);
		}
	}

	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "fbdownload",
	alias: "fbdl",
	desc: "Obtién multimedia de una publicacion de facebook",
};
