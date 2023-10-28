require("dotenv").config();
const { prefix, owner } = process.env;
const { lyricsv2 } = require("@bochilteam/scraper");

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
				text: `Es necesario proporcionar una busqueda, escribe ${prefix}lyrics (busqueda), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help lyrics.`,
			},
			{ quoted: msg },
		);
	try {
		const r = await lyricsv2(arg);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: r.lyrics,
			},
			{ quoted: msg },
		);
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
	name: `lyrics`,
	alias: `ly`,
	type: `ign`,
	description: `Envia la letra de alguna cancion.`,
	fulldesc: `Comando para enviar la letra de una cancion segun la busqueda proporcionada, escribe ${prefix}lyrics (busqueda), o con su alias ${prefix}ly (busqueda), recuerda que no es necesario escribir los parentesis, tambien puedes responder al titulo de una cancion, usando ${prefix}lyrics, o su alias ${prefix}ly, al responderlo. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
