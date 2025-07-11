require("dotenv").config();
const { prefix } = process.env;
const { instagram } = require("../lib/scrapper")
const { errorHandler } = require("../lib/functions");

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
				text: `Debes proporcionar un enlace, escribe ${prefix}igdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(
		/(?:https?:\/\/)?(?:www.)?instagram.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p]+)?([reel]+)?([tv]+)?([stories]+)?\/([a-zA-Z0-9\-\_\.]+)\/?([0-9]+)?/gm,
	);
	if (!isurl)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);
	try {
		const result = await instagram(arg);
		if (result.msg) return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "No se encontro el contenido.",
			},
			{ quoted: msg },
		);
		result.url.forEach(e => {
			if (e.includes("jpg") || result.metadata !== undefined) {
				sock.sendMessage(
					msg.key.remoteJid,
					{
						caption: "w",
						image: { url: e },
					},
					{ quoted: msg },
				);
			} else {
				sock.sendMessage(
					msg.key.remoteJid,
					{
						caption: "w",
						video: { url: e },
					},
					{ quoted: msg },
				);
			}
		});
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `igdownload`,
	alias: [`igdl`, `ig`, `instagram`],
	type: `misc`,
	description: `Envia la contenido de alguna publicacion de Instagram.`,
};
