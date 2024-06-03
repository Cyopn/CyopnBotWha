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

				yt.convertVideo(
					{
						url: arg,
						itag: 136,
						directoryDownload: "./temp/",
						title: ttl,
					},
					(t) => {},
					async () => {
						await sock.sendMessage(
							msg.key.remoteJid,
							{
								video: {
									url: `./temp/${ttl}.mp4`,
								},
							},
							{ quoted: msg },
						);
						fs.unlinkSync(`./temp/${ttl}.mp4`);
					},
				);
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

				yt.convertVideo(
					{
						url: rs.url,
						itag: 136,
						directoryDownload: "./temp/",
						title: ttl,
					},
					(t) => {},
					async () => {
						await sock.sendMessage(
							msg.key.remoteJid,
							{
								video: {
									url: `./temp/${ttl}.mp4`,
								},
							},
							{ quoted: msg },
						);
						fs.unlinkSync(`./temp/${ttl}.mp4`);
					},
				);
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
	name: "videodl",
	alias: "vd",
	type: `misc`,
	description: `Descarga videos de youtube.`,
	fulldesc: `Con este comando puedes descargar videos de youtube, solo necesitas proporcionar un enlace o una busqueda.`,
};
