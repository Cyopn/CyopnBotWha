require("dotenv").config();
const { prefix, token } = process.env;
const axios = require("axios").default;
const { errorHandler, createStaticSticker, createAnimatedSticker, tgsConverter } = require("../lib/functions");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join("").length >= 1
			? args[0].join("")
			: args[1] === undefined
				? ""
				: args[1].join("");
	if (!arg)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un enlace. Escribe ${prefix}stelegram (enlace). No es necesario escribir los paréntesis.`,
			},
			{ quoted: msg },
		);
	try {
		if (!arg.includes("https://t.me/addstickers/"))
			return await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `El enlace proporcionado no es válido; recuerda que debe ser el enlace directo del paquete de stickers de Telegram.`,
				},
				{ quoted: msg },
			);
		const pack = arg.replace("https://t.me/addstickers/", "");
		const response = await axios.get(
			`https://api.telegram.org/bot${token}/getStickerSet?name=${pack}`,
		);
		if (response.data.ok) {
			const stickers = response.data.result.stickers;
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Se ha encontrado el paquete *${pack}* con *${stickers.length}* stickers. El envío puede demorar un momento. Por favor, espera.`,
				},
				{ quoted: msg },
			);
			for (const s of stickers) {
				try {
					const file = await axios.get(
						`https://api.telegram.org/bot${token}/getFile?file_id=${s.file_id}`,
					);
					const st = await axios.get(
						`https://api.telegram.org/file/bot${token}/${file.data.result.file_path}`,
						{ responseType: "arraybuffer" },
					);
					const buffer = Buffer.from(st.data);
					let result = null;
					const filePath = file.data.result.file_path;
					if (filePath.endsWith(".tgs") || s.is_animated === true) {
						const gifUrl = await tgsConverter(buffer);
						const gifRes = await axios.get(gifUrl, { responseType: "arraybuffer" });
						const gifBuffer = Buffer.from(gifRes.data);
						result = await createAnimatedSticker(gifBuffer);
					} else if (s.is_video === true || filePath.endsWith(".webm")) {
						result = await createAnimatedSticker(buffer);
					} else {
						result = await createStaticSticker(buffer);
					}
					if (result) {
						await sock.sendMessage(
							msg.key.remoteJid, 
							{ sticker: result }, 
							{ quoted: msg }
						);
					} else {
						console.error(`[stelegram] No se pudo optimizar/crear el sticker: ${filePath}`);
					}
					await sleep(1500);
				} catch (e) {
					console.error(`[stelegram] Error procesando el sticker ${s.file_id}:`, e);
				}
			}
			await sock.sendMessage(
				msg.key.remoteJid,
				{ text: "✅ Envío del paquete completado." },
				{ quoted: msg }
			);
		} else {
			await sock.sendMessage(
				msg.key.remoteJid,
				{ text: "No se pudo encontrar el paquete de stickers. Verifica el enlace." },
				{ quoted: msg }
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `stelegram`,
	alias: [`st`],
	type: `misc`,
	description: `Envía stickers de un paquete de Telegram optimizados para WhatsApp.`,
};