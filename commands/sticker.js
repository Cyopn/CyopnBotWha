require("dotenv").config();
const { prefix, owner } = process.env;
const { sticker } = require("../lib/functions");
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
						?.videoMessage/* 
					: msg.message?.viewOnceMessage?.message?.imageMessage
						? msg.message?.viewOnceMessage?.message?.imageMessage
						: msg.message?.viewOnceMessage?.message?.videoMessage
							? msg.message?.viewOnceMessage?.message?.videoMessage
							: msg.message?.viewOnceMessageV2?.message?.imageMessage
								? msg.message?.viewOnceMessageV2?.message?.imageMessage
								: msg.message?.viewOnceMessageV2?.message?.videoMessage
									? msg.message?.viewOnceMessageV2?.message?.videoMessage
									: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
										?.viewOnceMessage?.message?.imageMessage
										? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
											?.viewOnceMessage?.message?.imageMessage
										: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
											?.viewOnceMessage?.message?.videoMessage
											? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
												?.viewOnceMessage?.message?.videoMessage
											: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
												?.viewOnceMessageV2?.message?.imageMessage
												? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
													?.viewOnceMessageV2?.message?.imageMessage
												: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
													?.viewOnceMessageV2?.message?.videoMessage
													? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
														?.viewOnceMessageV2?.message?.videoMessage */
					: undefined;
	if (m === undefined || m === null || type === undefined || type === null) {
		sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Envia una imagen/video/gif con el comando *${prefix}sticker*, o bien, responde a alguno ya enviado.`,
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
				.catch((e) => {
					sock.sendMessage(`${owner}@s.whatsapp.net`, {
						text: String(e),
					});
					sock.sendMessage(
						msg.key.remoteJid,
						{
							text: "Ocurrio un error inesperado.",
						},
						{ quoted: msg },
					);
				});
		} catch (e) {
			await errorHandler(sock, msg, this.config.name, e);
		}
	}
};

module.exports.config = {
	name: "sticker",
	alias: "s",
	type: "misc",
	description: `Envia un sticker a partir de una imagen/video/gif, ya sea enviada o respondiendo a alguna ya enviada.`,
	fulldesc: `Este comando funciona para crear stickers (pegatinas), puedes enviar una imagen, video o gif escribiendo el prefijo ${prefix} junto al nombre del comando (sticker) o su alias (s) antes de enviarla, otra manera de usarlo es respondiendo a una imagen, video o gif ya enviado, de igual modo escribiendo el prefijo ${prefix} junto al nombre del comando (sticker) o su alias (s).\nEste comando lo puedes usar en grupos y mensajes directos.`,
};
