require("dotenv").config();
const { prefix, owner } = process.env;
const { instagramStory } = require("@bochilteam/scraper");

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
				text: `Debes proporcionar un nombre de usuario, escribe ${prefix}igstories (nombre de usuario), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const r = await instagramStory(arg).catch((e) => { });
	if (r === undefined) {
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El usuario no existe o la historia no esta disponible.`,
			},
			{ quoted: msg },
		);
	} else {
		try {
			r.results.forEach((rs) => {
				if (rs.isVideo || rs.url.includes(".mp4")) {
					sock.sendMessage(
						msg.key.remoteJid,
						{ video: { url: rs.url }, caption: "w" },
						{ quoted: msg },
					);
				} else {
					sock.sendMessage(
						msg.key.remoteJid,
						{ image: { url: rs.url }, caption: "w" },
						{ quoted: msg },
					);
				}
			});
		} catch (e) {
			const sub = msg.key.remoteJid.includes("g.us")
				? await sock.groupMetadata(msg.key.remoteJid)
				: {
					subject: msg.key.remoteJid.replace(
						"@s.whatsapp.net",
						"",
					),
				};
			await sock.sendMessage(`${owner}@s.whatsapp.net`, {
				text: `Error en ${this.config.name} - ${sub.subject}\n${String(
					e,
				)}`,
			});
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: "Ocurrio un error inesperado.",
				},
				{ quoted: msg },
			);
		}
	}
};

module.exports.config = {
	name: `igstories`,
	alias: `igs`,
	type: `misc`,
	description: `Envia la mutimedia de historias de Instagram.`,
	fulldesc: `Comando para descargar historias Instagram, escribe ${prefix}igstories (nombre de usuario), o con su alias ${prefix}igs (nombre de usuario), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un nombre de usuario ya enviado, usando ${prefix}igstories, o su alias ${prefix}igs respondiendo al nombre de usuario. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
