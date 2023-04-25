const igd = require("fg-ig");
module.exports.run = async (client, message, args, config) => {
	const { id, from } = message;
	const { prefix } = config;
	let ra = [];

	try {
		if (!args.join("")) {
			await client.reply(
				from,
				`Usa *${prefix}igdl [enlace] [indice(opcional)]*`,
				id
			);
		} else {
			await client.reply(from, `Espera un poco`, id);
			const arg = args[0];
			const index = args[1];
			const isUrl = arg.match(
				/(?:(?:http|https):\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9-_\.]+)/im
			);

			if (isUrl) {
				if (index) {
					let res = await igd(arg);
					res.url_list.forEach((r) => {
						ra.push(r);
					});
					await client.sendFile(from, ra[index - 1], "nose", `w`, id);
				} else {
					let res = await igd(arg);

					res.url_list.forEach((r) => {
						client.sendFile(from, r, "nose", `w`, id);
					});
				}
			} else {
				await client.reply(from, `El enlace no es valido`, id);
			}
		}
	} catch (e) {
		console.error(
			`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
			e
		);
		await client.reply(from, `Ocurrio un error`, id);
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "igdownload",
	alias: "igdl",
	desc: "Obtién multimedia de una publicacion de instagram",
};
