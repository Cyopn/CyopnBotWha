require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { fbdl } = require("ruhend-scraper");
const { facebook } = require("../lib/scrapper");

module.exports.run = async (sock, msg, args) => {
	const arg = args[0].concat(args[1]);
	if (arg[0].length === 0 && arg[1] === undefined && arg.length === 2)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace. Escribe ${prefix}fbdownload (enlace). No es necesario escribir los paréntesis.`,
			},
			{ quoted: msg },
		);
	let urls = [];
	arg.forEach((e) => {
		if (e === undefined || e.length === 0) return;
		const isurl = e.match(/www.facebook.com|fb.watch/g);
		if (isurl) urls.push(e);
	});
	if (urls.length === 0)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `No se encontraron enlaces válidos.`,
			},
			{ quoted: msg },
		);
	try {
		urls.forEach(async (e) => {
			let retries = 0;
			let videoUrl = "";
			while (retries < 2) {
				if (retries < 2) {
					const r = await facebook(e);
					if (r.status === "error" || r.data.links.length === 0) {
						retries++;
						continue;
					} else {
						videoUrl = r.data.links[0];
						retries = 3;
					}
				}
			}
			if (videoUrl === "") {
				return await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: "No se pudo obtener el contenido.",
					},
					{ quoted: msg },
				);
			}
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					caption: "w",
					video: { url: videoUrl },
				},
				{ quoted: msg },
			);
		});
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `fbdownload`,
	alias: [`fbdl`, `fb`, `facebook`],
	type: `misc`,
	description: `Envía el vídeo de una publicación de Facebook.`,
};
