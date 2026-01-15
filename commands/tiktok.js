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
				text: `Debes proporcionar un enlace. Escribe ${prefix}tiktok (enlace). No es necesario escribir los paréntesis.`,
			},
			{ quoted: msg },
		);
	try {
		const res = await tiktok(arg);
		if (res.data.error) return await sock.sendMessage(msg.key.remoteJid, { text: res.data.error }, { quoted: msg });
		if (res.data.video) {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					video: { url: res.data.video },
					caption: `w`,
				},
				{ quoted: msg },
			);
		} else {
			res.data.image.forEach(async (image) => {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						image: { url: image },
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
	description: `Envía vídeo o imagen(es) de TikTok sin marca de agua.`,
};
