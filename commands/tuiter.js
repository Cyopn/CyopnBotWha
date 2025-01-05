require("dotenv").config();
const { prefix, owner } = process.env;
const { twitter } = require("../lib/scrapper");
const { errorHandler } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
	let arg =
		args[1] === undefined && args[0].join("").length >= 1
			? args[0].join("")
			: args[1] === undefined
				? ""
				: args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto, escribe ${prefix}twitter (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help.`,
			},
			{ quoted: msg },
		);
	try {
		const res = await twitter(arg)
		if (res.length > 0) {
			res.forEach(async (media) => {
				if (media.type == "video") {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							video: { url: media.url },
						},
						{ quoted: msg },
					);
				} else {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							image: { url: media.url },
						},
						{ quoted: msg },
					);
				}
			})
		} else {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: "No se encontraron videos o imagenes en el enlace proporcionado.",
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `tuiter`,
	alias: `twitter`,
	type: `misc`,
	description: `Envia multimedia (video, imagen o gif) de twitter.`,
	fulldesc: `Comando para descargar videos, imagenes o gifs de Twitter (X), escribe ${prefix}tuiter (enlace), o con su alias ${prefix}twitter (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tuiter, o su alias ${prefix}twitter respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
