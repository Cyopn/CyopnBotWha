require("dotenv").config();
const { prefix, owner } = process.env;
const { ytSolver } = require("../lib/functions");
const yt = require("yt-converter");
const yts = require("youtube-sr").default;
const fs = require("fs");

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
			const { status, title, author, error, time, thumb } =
				await ytSolver(arg);
			if (status === 200) {
				await sock.sendMessage(
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

				const data = await yt.Video({
					url: arg,
					directory: "./temp/",
					title: ttl,
					onDownloading: (progress) => { }
				});

				if (data.error) return await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Ocurrio un error al descargar el video.`,
					},
					{ quoted: msg },
				);

				await sock.sendMessage(
					msg.key.remoteJid,
					{
						document: fs.readFileSync(`./temp/${ttl}.mp4`),
						fileName: `${ttl}.mp4`,
						mimetype: "video/mp4",
					},
					{ quoted: msg },
				);
				if (fs.existsSync(`./temp/${ttl}.mp4`)) fs.unlinkSync(`./temp/${ttl}.mp4`);
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
			const [rs] = await yts.search(arg, { limit: 1 });
			const { status, title, author, error, time, thumb } =
				await ytSolver(rs.url);
			if (status === 200) {
				await sock.sendMessage(
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

				const data = await yt.Video({
					url: arg,
					directory: "./temp/",
					title: ttl,
					onDownloading: (progress) => { }
				});

				if (data.error) return await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Ocurrio un error al descargar el video.`,
					},
					{ quoted: msg },
				);

				await sock.sendMessage(
					msg.key.remoteJid,
					{
						document: fs.readFileSync(`./temp/${ttl}.mp4`),
						fileName: `${ttl}.mp4`,
						mimetype: "video/mp4",
					},
					{ quoted: msg },
				);
				if (fs.existsSync(`./temp/${ttl}.mp4`)) fs.unlinkSync(`./temp/${ttl}.mp4`);
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
	name: "videodl",
	alias: "vd",
	type: `misc`,
	description: `Descarga videos de youtube.`,
	fulldesc: `Con este comando puedes descargar videos de youtube, solo necesitas proporcionar un enlace o una busqueda.`,
};
