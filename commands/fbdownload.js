const { prefix } = require("../config.json");
const { savefrom } = require("@bochilteam/scraper");

module.exports.run = async (sock, msg, args) => {
	const arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}fbdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isUrl = arg.match(/www.facebook.com|fb.watch/g);
	if (!isUrl)
		return await client.reply(
			from,
			`El enlace proporcionado no es valido.`,
			id,
		);
	try {
		const r = await savefrom(arg);

		sock.sendMessage(
			msg.key.remoteJid,
			{ video: { url: r[0].hd.url }, caption: "w" },
			{ quoted: msg },
		);
	} catch (e) {
		if (e.toString().contains("Error: Cannot find data"))
			return sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `El enlace proporcionado no es valido.`,
				},
				{ quoted: msg },
			);
	}
};

module.exports.config = {
	name: `fbdownload`,
	alias: `fbdl`,
	type: `misc`,
	description: `Envia el video de alguna publicacion de Facebook.`,
	fulldesc: `Comando para descargar videos de Facebook, escribe ${prefix}fbdownload (enlace), o con su alias ${prefix}fbdl (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado usando ${prefix}fbdownload, o su alias (${prefix})fbdl respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
