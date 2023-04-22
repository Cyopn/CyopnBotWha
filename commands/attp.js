const axios = require("axios").default;

module.exports.run = async (client, message, args, config) => {
	const { id, from } = message;
	let arg = args.join(" ");
	try {
		if (!arg)
			return await client.reply(
				from,
				`Envia tu consulta con el comando *${config.prefix}attp [texto]*, ejemplo : ${config.prefix}attp hola`,
				id
			);
		await client.reply(from, `Espera un poco`, id);
		let response = await axios.get(
			`https://api.helv.io/attp?text=${encodeURIComponent(
				arg
			)}&format=base64`
		);

		client.sendImageAsSticker(from, response.data, {
			author: "ig: @Cyopn_",
			pack: "CyopnBot",
			keepScale: true,
		});
	} catch (e) {
		console.error(
			`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
			e.toString()
		);
		client.reply(from, `Ocurrio un error`, id);
		await client.reply(from, `Ocurrio un error`, id);
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "attp",
	alias: "ap",
	desc: "Crea un sticker a partir de un texto",
};
