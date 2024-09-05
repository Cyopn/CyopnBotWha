require("dotenv").config();
const { prefix, owner } = process.env;
const { twitter } = require("@bochilteam/scraper");
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
		const highres = res.reduce((prev, curr) => curr.bitrate > prev.bitrate ? curr : prev);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				caption: "w",
				video: { url: highres.url },
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
				text: "Ocurrio un error inesperado.\nProbablemente el contenido no esta disponible o no es un video.",
			},
			{ quoted: msg },
		);
	}
};

module.exports.config = {
	name: `tuiter`,
	alias: `twitter`,
	type: `misc`,
	description: `Envia algun video de twitter.`,
	fulldesc: `Comando para descargar videos de Twitter (X), escribe ${prefix}tuiter (enlace), o con su alias ${prefix}twitter (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tuiter, o su alias ${prefix}twitter respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
