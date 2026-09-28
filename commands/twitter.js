require("dotenv").config();
const { prefix } = process.env;
const axios = require("axios"); // Necesario para descargar el buffer antes de procesarlo
const { twitter } = require("../lib/scrapper");
const { errorHandler, fixTwitterVideo } = require("../lib/functions");

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
				text: `Es necesario proporcionar un enlace. Escribe ${prefix}twitter (enlace). No es necesario escribir los paréntesis. Si tienes dudas sobre este comando, escribe ${prefix}help.`,
			},
			{ quoted: msg },
		);
	try {
		const res = await twitter(arg);
		if (res.length > 0) {
			for (const media of res) {
				if (media.type === "video") {
					let videoPayload = {};
					let caption = "w";
					if (media.url.includes("tweet_video")) {
						try {
							const response = await axios.get(media.url, { 
								responseType: "arraybuffer",
								headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
							});
							const originalBuffer = Buffer.from(response.data);
							const fixedBuffer = await fixTwitterVideo(originalBuffer);
							if (fixedBuffer) {
								videoPayload = { 
									video: fixedBuffer, 
									mimetype: "video/mp4" 
								};
							} else {
								videoPayload = { video: { url: media.url } };
								caption += `\nSi no reproduce, usa el enlace directo: ${media.url}`;
							}
						} catch (err) {
							videoPayload = { video: { url: media.url } };
							caption += `\nSi no reproduce, usa el enlace directo: ${media.url}`;
						}
					} else {
						videoPayload = { video: { url: media.url } };
					}
					await sock.sendMessage(
						msg.key.remoteJid,
						{ ...videoPayload, caption },
						{ quoted: msg }
					);
				} else if (media.type === "image") {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							image: { url: media.url },
						},
						{ quoted: msg },
					);
				}
			}
		} else {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: "No se encontraron vídeos o imágenes en el enlace proporcionado.",
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `twitter`,
	alias: [`tuiter`, `tw`, `x`],
	type: `misc`,
	description: `Envía multimedia (vídeo, imagen o gif) de Twitter optimizado para WhatsApp.`,
};