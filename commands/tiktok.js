require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { tiktok } = require("../lib/scrapper");

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
				text: `Debes proporcionar un enlace, escribe ${prefix}tiktok (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	try {
		const res = await tiktok(arg)
		if (res.video) {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					video: { url: res.video.noWatermark },
					caption: `w`,
				},
				{ quoted: msg },
			);
		} else {
			res.images.forEach(async (image) => {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						image: { url: image.url },
						caption: `w`,
					},
					{ quoted: msg },
				);
			});
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `tiktok`,
	alias: [`tk`],
	type: `misc`,
	description: `Envia video o imagen(es) de tiktok sin marca de agua.`,
};
