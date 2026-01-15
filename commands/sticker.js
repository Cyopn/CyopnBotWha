require("dotenv").config();
const { prefix, owner } = process.env;
const { sticker, errorHandler } = require("../lib/functions");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports.run = async (sock, msg, args) => {
	const type =
		msg.message.imageMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.imageMessage ||
			msg.message?.viewOnceMessage?.message?.imageMessage ||
			msg.message?.viewOnceMessageV2?.message?.imageMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.viewOnceMessage?.message?.imageMessage ||
			msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
				?.viewOnceMessageV2?.message?.imageMessage
			? "image"
			: msg.message?.videoMessage ||
				msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
					?.videoMessage ||
				msg.message?.viewOnceMessage?.message?.videoMessage ||
				msg.message?.viewOnceMessageV2?.message?.videoMessage ||
				msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
					?.viewOnceMessage?.message?.videoMessage ||
				msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
					?.viewOnceMessageV2?.message?.videoMessage
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
					?.videoMessage
					? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
						?.videoMessage
					: undefined;
	if (m === undefined || m === null || type === undefined || type === null) {
		sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Envía una imagen/vídeo/gif con el comando *${prefix}sticker*, o bien responde a uno ya enviado.`,
			},
			{ quoted: msg },
		);
	} else {
		try {
			const w = await downloadContentFromMessage(m, type).catch(async (e) => {
				await errorHandler(sock, msg, "sticker", e);
			});
			let buffer = Buffer.from([]);
			for await (const chunk of w) {
				buffer = Buffer.concat([buffer, chunk]);
			}
			let s = await sticker(buffer).catch(async (e) => {
				await errorHandler(sock, msg, "sticker", e);
			});
			await sock
				.sendMessage(msg.key.remoteJid, { sticker: s }, { quoted: msg })
				.catch(async (e) => {
					await errorHandler(sock, msg, this.config.name, e);
				});
		} catch (e) {
			await errorHandler(sock, msg, this.config.name, e);
		}
	}
};

module.exports.config = {
	name: "sticker",
	alias: [`s`],
	type: "misc",
	description: `Envía un sticker a partir de una imagen/vídeo/gif, ya sea enviada o respondiendo a uno ya enviado.`,
};
