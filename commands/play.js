require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const yts = require("youtube-sr").default;
const { ytmp3 } = require("ruhend-scraper");

module.exports.run = async (sock, msg, args) => {
	let arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}play (enlace o busqueda), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(
		/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gim,
	);
	try {
		if (isurl) {
			const { title, audio, author, description, duration, views, upload, thumbnail } = await ytmp3(arg)
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
					audio: { url: audio },
					mimetype: "audio/mpeg",
				},
				{ quoted: msg },
			);
		} else {
			const [rs] = await yts.search(arg, { limit: 1, safeSearch: false });
			const { title, audio, author, description, duration, views, upload, thumbnail } = await ytmp3(`https://www.youtube.com/watch?v=${rs.id}`)
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
					audio: { url: audio },
					mimetype: "audio/mpeg",
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `play`,
	alias: `p`,
	type: `ign`,
	description: `Descarga en forma de audio un video de youtube, ya sea con el enlace o una busqueda.`,
	fulldesc: `Comando para descargar (en forma de audio) algun video de youtube, usa este comando escribiendo ${prefix}play (enlace o busqueda) o su alias, ${prefix}p (enlace o busqueda), recuerda que no es necesario escribir los corchetes. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
