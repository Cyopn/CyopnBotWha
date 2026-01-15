require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join(" ").length >= 1
			? args[0].join(" ")
			: args[1] === undefined
				? ""
				: args[1].join(" ");
	if (!msg.key.remoteJid.includes("g.us"))
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Comando disponible solo en grupos.`,
			},
			{ quoted: msg },
		);
	const isAdmin = (
		await sock.groupMetadata(msg.key.remoteJid)
	).participants.some(
		(e) => e.id === msg.key.participant && e.admin !== null,
	);
	if (!isAdmin)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes ser administrador para usar este comando.`,
			},
			{ quoted: msg },
		);
	if (!arg)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto. Escribe ${prefix}tagall (texto). No es necesario escribir los paréntesis. Si tienes dudas sobre este comando, escribe ${prefix}help tagall.`,
			},
			{ quoted: msg },
		);
	try {
		const { participants } = await sock.groupMetadata(msg.key.remoteJid);
		let mention = [];
		let mentiontext = "";
		for (let participant of participants) {
			mentiontext += `@${participant.id.replace(
				"@s.whatsapp.net",
				"",
			)} \n`;
			mention.push(participant.id);
		}
		sock.sendMessage(
			msg.key.remoteJid,
			{
				text: arg,
				mentions: mention,
			},
			{ quoted: msg },
		);
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `tagall`,
	alias: [`tag`],
	type: `misc`,
	description: `Menciona a todos los miembros del grupo con un mensaje personalizado.`,
};
