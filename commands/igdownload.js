require("dotenv").config();
const { prefix, owner } = process.env;
const { getInstagramUrl, errorHandler } = require("../lib/functions")

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
				text: `Debes proporcionar un enlace, escribe ${prefix}igdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(
		/(?:https?:\/\/)?(?:www.)?instagram.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p]+)?([reel]+)?([tv]+)?([stories]+)?\/([a-zA-Z0-9\-\_\.]+)\/?([0-9]+)?/gm,
	);
	if (!isurl)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);
	try {
		const result = await getInstagramUrl(arg)
		if (result.results_number > 0) {
			result.url_list.forEach(async (rs) => {
				if (rs.includes("jpg")) {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							image: { url: rs },
						},
						{ quoted: msg },
					);
				} else {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							video: { url: rs },
						},
						{ quoted: msg },
					);
				}
			})
		} else {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: "No se encontro el contenido.",
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `igdownload`,
	alias: `igdl`,
	type: `misc`,
	description: `Envia la mutimedia de alguna publicacion de Instagram.`,
	fulldesc: `Comando para descargar videos de Instagram, escribe ${prefix}igdownload (enlace), o con su alias ${prefix}igdl (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}igdownload, o su alias ${prefix}igdl respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
