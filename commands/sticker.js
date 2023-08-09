const { prefix } = require("../config.json");
const { sticker } = require("../lib/functions");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports.run = async (sock, msg) => {
	const type =
		msg.message.imageMessage ||
		msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
			?.imageMessage
			? "image"
			: msg.message?.videoMessage ||
			  msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
					?.videoMessage
			? "video"
			: undefined;
	const m = msg.message?.imageMessage
		? msg.message?.imageMessage
		: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.imageMessage
		? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.imageMessage
		: msg.message?.videoMessage
		? msg.message?.videoMessage
		: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.videoMessage;

	if (m === undefined || m === null || type === undefined || type === null) {
		sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Envia una imagen/video/gif con el comando *${prefix}sticker*, o bien, responde a alguno ya enviado.`,
			},
			{ quoted: msg },
		);
	} else {
		const w = await downloadContentFromMessage(m, type);
		let buffer = Buffer.from([]);
		for await (const chunk of w) {
			buffer = Buffer.concat([buffer, chunk]);
		}
		let s = await sticker(buffer);
		await sock
			.sendMessage(msg.key.remoteJid, { sticker: s }, { quoted: msg })
			.catch((e) => {
				console.log(e);
			});
	}
};

module.exports.config = {
	name: "sticker",
	alias: "s",
	type: "misc",
	description: `Envia un sticker a partir de una imagen/video/gif, ya sea enviada o respondiendo a alguna ya enviada.`,
	fulldesc: `Este comando funciona para crear stickers (pegatinas), puedes enviar una imagen, video o gif escribiendo el prefijo (${prefix}) junto al nombre del comando (sticker) o su alias (s) antes de enviarla, otra manera de usarlo es respondiendo a una imagen, video o gif ya enviado, de igual modo escribiendo el prefijo (${prefix}) junto al nombre del comando (sticker) o su alias (s).\nEste comando lo puedes usar en grupos y mensajes directos.`,
};
