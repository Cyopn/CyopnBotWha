const { prefix } = require("../config.json");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { toMp4 } = require("../lib/functions");

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

	const w = await downloadContentFromMessage(s, "sticker");
	let buffer = Buffer.from([]);
	for await (const chunk of w) {
		buffer = Buffer.concat([buffer, chunk]);
	}
	try {
		const r = await toMp4(buffer);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				caption: "w",
				video: { url: r },
			},
			{ quoted: msg },
		);
	} catch (e) {}
};

module.exports.config = {
	name: "tovideo",
	alias: "tv",
	type: `misc`,
	description:
		"Convierte a video un sticker animado ya enviado, respondiendo a el.",
	fulldesc: `Comando para convertir sticker animado a video respondiendo a uno ya enviado, escribiendo el prefijo ${prefix} junto al nombre del comando (tovideo) o su alias (tv).\nEste comando lo puedes usar en grupos y mensajes directos.`,
};
