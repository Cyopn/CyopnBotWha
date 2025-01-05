require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { tiktok } = require("../lib/scrapper");

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
				text: `Debes proporcionar un enlace, escribe ${prefix}tiktok (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	try {
		const res = await tiktok(arg, "media")
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
	name: `tiktok`,
	alias: `tk`,
	type: `misc`,
	description: `Envia algun tiktok sin marca de agua.`,
	fulldesc: `Comando para descargar videos de Tiktok, escribe ${prefix}tiktok (enlace), o con su alias ${prefix}tk (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tiktok, o su alias ${prefix}tk respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
