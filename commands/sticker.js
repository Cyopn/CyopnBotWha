const { prefix } = require("../config.json");
const { decryptMedia } = require("@open-wa/wa-decrypt");

module.exports.run = async (client, message, args) => {
	const { quotedMsg, isMedia, id, from } = message;
	const msg = isMedia
		? message
		: quotedMsg
		? quotedMsg.isMedia
			? quotedMsg
			: undefined
		: undefined;
	if (msg !== undefined) {
		if (msg.mimetype === "video/mp4") {
			await client.reply(from, `Espera un momento.`, id);
			const mediaData = await decryptMedia(msg);
			await client
				.sendMp4AsSticker(
					from,
					`data:${msg.mimetype};base64,${mediaData.toString(
						"base64"
					)}`,
					{
						crop: false,
					},
					{
						author: "ig: @Cyopn_",
						pack: "CyopnBot",
					}
				)
				.catch((e) => {
					if (
						e
							.toString()
							.includes(
								"STICKER_TOO_LARGE: maxContentLength size of 1500000 exceeded"
							) ||
						e.toString().includes("Error: Evaluation failed: a")
					)
						return client.reply(
							from,
							"Es imposible crear el sticker, el archivo es demasiado pesado.",
							id
						);
				});
		} else {
			const mediaData = await decryptMedia(msg);
			const imageBase64 = `data:${
				msg.mimetype
			};base64,${mediaData.toString("base64")}`;
			client.sendImageAsSticker(from, imageBase64, {
				author: "ig: @Cyopn_",
				pack: "CyopnBot",
				keepScale: true,
			});
		}
	} else {
		await client.reply(
			from,
			`Envia una imagen/video/gif con el comando *${prefix}sticker*, o bien, responde a alguno ya enviado.`,
			id
		);
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "sticker",
	alias: "s",
	type: "misc",
	description:
		"Envia un sticker a partir de una imagen/video/gif, ya sea enviada o respondiendo a alguna ya enviada",
	fulldesc: `Este comando funciona para crear stickers (pegatinas), puedes enviar una imagen, video o gif escribiendo el prefijo (${prefix}) junto al nombre del comando (sticker) o su alias (s) antes de enviarla, otra manera de usarlo es respondiendo a una imagen, video o gif ya enviado, de igual modo escribiendo el prefijo (${prefix}) junto al nombre del comando (sticker) o su alias (s).\nEste comando lo puedes usar en grupos y mensajes directos.`,
};
