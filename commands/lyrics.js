require("dotenv").config();
const { prefix } = process.env;
const { getLyrics, errorHandler } = require("../lib/functions");

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
		const r = await getLyrics(arg);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `_*${r.title} - ${r.author}*_\n${r.lyrics}\nFuente: ${r.link}`,
			},
			{ quoted: msg },
		);
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `lyrics`,
	alias: [`ly`],
	type: `misc`,
	description: `Envia la letra de alguna cancion.`,
};
