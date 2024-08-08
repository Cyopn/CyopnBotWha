require("dotenv").config();
const { prefix, owner } = process.env;
const axios = require("axios").default;
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
				text: `Comando solo disponible en grupos.`,
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
				text: `Es necesario proporcionar un texto, escribe ${prefix}tagall (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help tagall.`,
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
	name: `tagall`,
	alias: `tag`,
	type: `misc`,
	description: `Menciona a todos los miembros del grupo con un mensaje personalizado.`,
	fulldesc: `Comando para mencionar a todos los miembros del grupo con un mensaje personalizado, es necesario ser administrador para usar este comando.`,
};
