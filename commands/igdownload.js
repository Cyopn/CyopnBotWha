require("dotenv").config();
const { prefix } = process.env;
const { instagram } = require("../lib/scrapper");
const { errorHandler } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
	const mode = args[0][0] === "img" || args[0][0] === "video" ? args[0].shift() : "";
	const index = isNaN(args[0][args[0].length - 1]) ? "" : args[0].pop();
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
				text: `Debes proporcionar un enlace. Escribe ${prefix}igdownload (enlace). No es necesario escribir los paréntesis.`,
			},
			{ quoted: msg }
		);
	const isurl = arg.match(
		/(?:https?:\/\/)?(?:www.)?instagram.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p]+)?([reel]+)?([tv]+)?([stories]+)?\/([a-zA-Z0-9\-\_\.]+)\/?([0-9]+)?/gm,
	);
	if (!isurl)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es válido.`,
			},
			{ quoted: msg }
		);
	try {
		const result = await instagram(arg);
		if (result.msg) return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "No se encontró el contenido.",
			},
			{ quoted: msg }
		);
		let idx = 0;
		result.url.forEach(async e => {
			idx++;
			if (index) {
				if (idx != index) return;
				if (e.includes("jpg") || mode === "img") {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							image: { url: e },
						},
						{ quoted: msg }
					);
				} else if (mode === "video") {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							video: { url: e },
						},
						{ quoted: msg }
					);
				}
				else {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							video: { url: e },
						},
						{ quoted: msg }
					);
				}
			} else {
				if (e.includes("jpg") || mode === "img") {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							image: { url: e },
						},
						{ quoted: msg }
					);
				} else if (mode === "video") {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							video: { url: e },
						},
						{ quoted: msg }
					);
				}
				else {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							video: { url: e },
						},
						{ quoted: msg }
					);
				}
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
	description: `Envía el contenido de una publicación de Instagram.`,
};
