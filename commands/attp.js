const { prefix } = require("../config.json");
const axios = require("axios").default;

module.exports.run = async (client, message, args) => {
	const { id, from } = message;
	const arg = args[1] === undefined ? args[0].join(" ") : args[1].join(" ");
	console.log(arg);
	if (!arg)
		return await client.reply(
			from,
			`Es necesario proporcionar un texto, escribe ${prefix}attp (texto), si tienes dudas sobre este comando escribe ${prefix}help attp`,
			id
		);
	const r = await axios.get(
		`https://api.helv.io/attp?text=${encodeURIComponent(arg)}&format=base64`
	);
	await client.sendImageAsSticker(from, r.data, {
		author: "ig: @Cyopn_",
		pack: "CyopnBot",
		keepScale: true,
	});
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `attp`,
	alias: `ap`,
	type: `misc`,
	description: `Crea un sticker segun el texto proporcionado, algunos emojis no son soportados, escribiendo ${prefix}attp (texto), recuerda que no es necesario escribir los parentesis.`,
	fulldesc: `Comando para crear stickers (pegatinas), algunos emojis no son soportados, usa este comando escribiendo ${prefix}attp (texto), o con su alias ${prefix}ap (texto), recuerda que no es necesario escribir los parentesis. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
