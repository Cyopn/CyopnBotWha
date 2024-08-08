require("dotenv").config();
const { prefix, owner } = process.env;
const { sticker } = require("../lib/functions");
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
		const sub = msg.key.remoteJid.includes("g.us")
			? await sock.groupMetadata(msg.key.remoteJid)
			: {
				subject: msg.key.remoteJid.replace("@s.whatsapp.net", ""),
			};
		await sock.sendMessage(`${owner}@s.whatsapp.net`, {
			text: `Error en ${this.config.name} - ${sub.subject}\n${String(e)}`,
		});
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "Ocurrio un error inesperado.",
			},
			{ quoted: msg },
		);
	}
};

module.exports.config = {
	name: `attp`,
	alias: `ap`,
	type: `misc`,
	description: `Crea un sticker segun el texto proporcionado, algunos emojis no son soportados.`,
	fulldesc: `Comando para crear stickers (pegatinas), algunos emojis no son soportados, usa este comando escribiendo ${prefix}attp (texto), o con su alias ${prefix}ap (texto), recuerda que no es necesario escribir los parentesis. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
