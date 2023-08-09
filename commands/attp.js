const { prefix } = require("../config.json");
const { sticker } = require("../lib/functions");
const axios = require("axios").default;

module.exports.run = async (sock, msg, args) => {
	const arg = args[1] === undefined ? args[0].join(" ") : args[1].join(" ");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto, escribe ${prefix}attp (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help attp.`,
			},
			{ quoted: msg },
		);
	const r = await axios.get(
		`https://api.helv.io/attp?text=${encodeURIComponent(
			arg,
		)}&format=base64`,
	);
	const buffer = new Buffer.from(r.data, "base64");
	let s = await sticker(buffer);
	sock.sendMessage(msg.key.remoteJid, { sticker: s }, { quoted: msg });
};

module.exports.config = {
	name: `attp`,
	alias: `ap`,
	type: `misc`,
	description: `Crea un sticker segun el texto proporcionado, algunos emojis no son soportados.`,
	fulldesc: `Comando para crear stickers (pegatinas), algunos emojis no son soportados, usa este comando escribiendo ${prefix}attp (texto), o con su alias ${prefix}ap (texto), recuerda que no es necesario escribir los parentesis. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
