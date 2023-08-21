require("dotenv").config();
const { prefix, owner } = process.env;
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { toPng } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
	const s =
		msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
			?.stickerMessage;
	if (s === undefined || s === null)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Usa ${prefix}toimg respondiendo un sticker.`,
			},
			{ quoted: msg },
		);
	try {
		const w = await downloadContentFromMessage(s, "sticker");
		let buffer = Buffer.from([]);
		for await (const chunk of w) {
			buffer = Buffer.concat([buffer, chunk]);
		}
		const r = await toPng(buffer);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				caption: "w",
				image: { url: r },
			},
			{ quoted: msg },
		);
	} catch (e) {
		await sock.sendMessage(`${owner}@s.whatsapp.net`, {
			text: `Error en ${this.config.name} - ${
				msg.key.remoteJid
			}\n${String(e)}`,
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
	name: "toimg",
	alias: "ti",
	type: `misc`,
	description: "Convierte a imagen un sticker ya enviado, respondiendo a el.",
	fulldesc: `Comando para convertir sticker a imagen respondiendo a uno ya enviado, escribiendo el prefijo ${prefix} junto al nombre del comando (toimg) o su alias (ti).\nEste comando lo puedes usar en grupos y mensajes directos.`,
};
