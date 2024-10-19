require("dotenv").config();
const { prefix } = process.env;
const { ytSolver, errorHandler } = require("../lib/functions");
const yt = require("yt-converter");
const yts = require("youtube-sr").default;
const fs = require("fs");

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
			const { status, title, author, error, time, thumb } =
				await ytSolver(arg);
			if (status === 200) {
				const edit = await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
					},
					{ quoted: msg },
				);

				let ttl = "";
				for (let i = 0; i < title.length; i++) {
					ttl += title[i].match(/([A-Za-z])/g)
						? title[i]
						: title[i] === " "
							? " "
							: "";
				}

				const data = await yt.Audio({
					url: arg,
					directory: "./temp/",
					title: ttl,
					onDownloading: async (progress) => {
						//await sock.sendMessage(msg.key.remoteJid, { edit: edit.key, text: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos\nProgreso: ${progress.percentage.toFixed(2) === 100.00 ? progress.percentage.toFixed(2) + "%" : "Completo"}` })
					}
				});

				if (data.error) return await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Ocurrio un error al descargar el audio.`,
					},
					{ quoted: msg },
				);

				await sock.sendMessage(
					msg.key.remoteJid,
					{
						document: fs.readFileSync(`./temp/${ttl}.mp3`),
						fileName: `${ttl}.mp3`,
						mimetype: "audio/mpeg",
					},
					{ quoted: msg },
				);
				if (fs.existsSync(`./temp/${ttl}.mp3`)) fs.unlinkSync(`./temp/${ttl}.mp3`);
			} else {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `El enlace no es valido.`,
					},
					{ quoted: msg },
				);
			}
		} else {
			const [rs] = await yts.search(arg, { limit: 1, safeSearch: false });
			const { status, title, author, error, time, thumb } =
				await ytSolver(`https://www.youtube.com/watch?v=${rs.id}`);
			if (status === 200) {
				const edit = await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
					},
					{ quoted: msg },
				);

				let ttl = "";
				for (let i = 0; i < title.length; i++) {
					ttl += title[i].match(/([A-Za-z])/g)
						? title[i]
						: title[i] === " "
							? " "
							: "";
				}

				const data = await yt.Audio({
					url: `https://www.youtube.com/watch?v=${rs.id}`,
					directory: "./temp/",
					title: ttl,
					onDownloading: async (progress) => {
						//await sock.sendMessage(msg.key.remoteJid, { edit: edit.key, text: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos\nProgreso: ${progress.percentage.toFixed(2) === 100.00 ? progress.percentage.toFixed(2) + "%" : "Completo"}` })
					}
				});

				if (data.error) return await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Ocurrio un error al descargar el audio.`,
					},
					{ quoted: msg },
				);

				await sock.sendMessage(
					msg.key.remoteJid,
					{
						document: fs.readFileSync(`./temp/${ttl}.mp3`),
						fileName: `${ttl}.mp3`,
						mimetype: "audio/mpeg",
					},
					{ quoted: msg },
				);
				if (fs.existsSync(`./temp/${ttl}.mp3`)) fs.unlinkSync(`./temp/${ttl}.mp3`);
			} else {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `No se encontro nada.`,
					},
					{ quoted: msg },
				);
			}
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `play`,
	alias: `p`,
	type: `misc`,
	description: `Descarga en forma de audio un video de youtube, ya sea con el enlace o una busqueda.`,
	fulldesc: `Comando para descargar (en forma de audio) algun video de youtube, usa este comando escribiendo ${prefix}play (enlace o busqueda) o su alias, ${prefix}p (enlace o busqueda), recuerda que no es necesario escribir los corchetes. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
