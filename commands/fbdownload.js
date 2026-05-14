require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const {facebook}=require("../lib/scrapper");

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
				text: `Debes proporcionar un enlace. Escribe ${prefix}fbdownload (enlace). No es necesario escribir los paréntesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(/www.facebook.com|fb.watch/g);
	if (!isurl)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es válido.`,
			},
			{ quoted: msg },
		);
	try {
		const r = await facebook(arg);
		if (r.status === "error") return await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener el contenido." }, { quoted: msg });
		const data = r.data.links;
		if (data.length === 0) return await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener el contenido." }, { quoted: msg });
		const videoUrl = data[0];
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				video: { url: videoUrl },
			},
			{ quoted: msg },
		);
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `fbdownload`,
	alias: [`fbdl`, `fb`, `facebook`],
	type: `misc`,
	description: `Envía el vídeo de una publicación de Facebook.`,
	expects: ['link'],
	returns: ['video']
};
