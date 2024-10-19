require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { fbdl } = require("ruhend-scraper")

module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join("").length >= 1
			? args[0].join("")
			: args[1] === undefined
				? ""
				: args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}fbdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(/www.facebook.com|fb.watch/g);
	if (!isurl)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);
	try {
		const r = await fbdl(arg);
		if (!r.status) return await sock.sendMessage(msg.key.remoteJid, { text: "No se encontro el contenido." }, { quoted: msg });
		const data = r.data.find(i => i.resolution === "720p (HD)") || r.data.find(i => i.resolution === "360p (SD)");
		if (!data) return await sock.sendMessage(msg.key.remoteJid, { text: "No se encontro el contenido." }, { quoted: msg });
		await sock.sendMessage(
			msg.key.remoteJid,
			{ video: { url: data.url }, caption: "w" },
			{ quoted: msg },
		);
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `fbdownload`,
	alias: `fbdl`,
	type: `misc`,
	description: `Envia el video de alguna publicacion de Facebook.`,
	fulldesc: `Comando para descargar videos de Facebook, escribe ${prefix}fbdownload (enlace), o con su alias ${prefix}fbdl (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}fbdownload, o su alias ${prefix}fbdl respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
