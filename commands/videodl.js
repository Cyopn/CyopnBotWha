require("dotenv").config();
const { prefix, owner } = process.env;
const yts = require("youtube-sr").default;
const { errorHandler } = require("../lib/functions");
const { ytmp4 } = require("ruhend-scraper");

module.exports.run = async (sock, msg, args) => {
	let arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}videodl (enlace o busqueda), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(
		/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gim,
	);
	try {
		if (isurl) {
			const { title, video, author, description, duration, views, upload, thumbnail } = await ytmp4(arg)
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Inicia el envio de *${title}*\nCanal/Autor: ${author}\nDuracion: ${duration} minutos.`,
				},
				{ quoted: msg },
			);
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					video: { url: video },
					caption: "w",
				},
				{ quoted: msg },
			);
		} else {
			const [rs] = await yts.search(arg, { limit: 1 });
			const { title, video, author, description, duration, views, upload, thumbnail } = await ytmp4(`https://www.youtube.com/watch?v=${rs.id}`)
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Inicia el envio de *${title}*\nCanal/Autor: ${author}\nDuracion: ${duration} minutos.`,
				},
				{ quoted: msg },
			);
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					video: { url: video },
					caption: "w",
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: "videodl",
	alias: "vd",
	type: `ign`,
	description: `Descarga videos de youtube.`,
	fulldesc: `Comando para descargar videos de youtube, solo necesitas proporcionar un enlace o una busqueda.`,
};
