require("dotenv").config();
const { prefix } = process.env;
const { sticker, errorHandler } = require("../lib/functions");
const axios = require("axios").default;

module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join(" ").length >= 1
			? args[0].join(" ")
			: args[1] === undefined
				? ""
				: args[1].join(" ");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto, escribe ${prefix}attp (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help attp.`,
			},
			{ quoted: msg },
		);
	try {
		const r = await axios.get(
			`https://api.helv.io/attp?text=${encodeURIComponent(
				arg,
			)}&format=base64`,
		);
		const buffer = new Buffer.from(r.data, "base64");
		let s = await sticker(buffer);
		sock.sendMessage(msg.key.remoteJid, { sticker: s }, { quoted: msg });
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `attp`,
	alias: [`ap`],
	type: `misc`,
	description: `Crea un sticker segun el texto proporcionado, algunos emojis no son soportados.`,
};
