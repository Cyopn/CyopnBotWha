const { prefix } = require("../config.json");
const ig = require("instagram-url-dl");

module.exports.run = async (client, message, args) => {
	const { id, from } = message;
	const arg = args[1] !== undefined ? args[1].join("") : args[0].join("");
	if (!arg)
		return await client.reply(
			from,
			`Debes proporcionar un enlace, escribe ${prefix}igdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			id,
		);
	const isUrl = arg.match(
		/(?:https?:\/\/)?(?:www.)?instagram.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p]+)?([reel]+)?([tv]+)?([stories]+)?\/([a-zA-Z0-9\-\_\.]+)\/?([0-9]+)?/gm,
	);
	if (!isUrl)
		return await client.reply(
			from,
			`El enlace proporcionado no es valido.`,
			id,
		);
	const r = await ig(arg);
	if (r.status) {
		console.log(r.data);
		r.data.forEach((rs) => {
			client.sendFileFromUrl(from, rs.url, "nose", `w`, id).catch((e) => {
				if (
					e
						.toString()
						.includes(
							"Error: Evaluation failed: Error: MediaFileTooLarge:",
						)
				) {
					client
						.sendFileFromUrl(from, rs.url, "nose", `w`, id)
						.catch((e) => {
							console.error(
								`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
								e.toString(),
							);
							client.reply(
								from,
								`Es imposible enviar el video`,
								id,
							);
						});
				} else {
					console.error(
						`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
						e.toString(),
					);
					client.reply(from, `Es imposible enviar el video`, id);
				}
			});
		});
	}

	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `igdownload`,
	alias: `igdl`,
	type: `misc`,
	description: ``,
	fulldesc: ``,
};
