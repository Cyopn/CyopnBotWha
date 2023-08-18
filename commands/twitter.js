const { prefix, owner } = require("../config.json");
const { twitterdl } = require("@bochilteam/scraper");

module.exports.run = async (sock, msg, args) => {
	const arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}tiktok (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const r = await twitterdl(arg).catch((e) => {});
	if (r === undefined) {
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);
	} else {
		try {
			await sock.sendMessage(
				msg.key.remoteJid,
				{ video: { url: r[0].url }, caption: "w" },
				{ quoted: msg },
			);
		} catch (e) {
			await sock.sendMessage(`${owner}@s.whatsapp.net`, {
				text: String(e),
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
	name: `twitter`,
	alias: `tw`,
	type: `misc`,
	description: `Envia el video de alguna publicacion de Twitter.`,
	fulldesc: `Comando para descargar videos de Twitter, escribe ${prefix}twitter (enlace), o con su alias ${prefix}tw (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}twitter, o su alias ${prefix}tw respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
