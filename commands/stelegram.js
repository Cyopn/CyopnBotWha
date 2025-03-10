require("dotenv").config();
const { prefix, owner, token } = process.env;
const axios = require("axios").default;
const { tgsConverter, sticker, errorHandler } = require("../lib/functions.js");

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
				text: `Es necesario proporcionar un enlace, escribe ${prefix}stelegram (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help stelegram.`,
			},
			{ quoted: msg },
		);
	try {
		if (!arg.includes("https://t.me/addstickers/"))
			return await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `El enlace proporcionado no es valido, recuerda que el enlace debe ser directo del paquete de stickers.`,
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
					text: `Se he encontrado el paquete de ${pack} con ${stickers.length} stickers, el envio puede demorar un poco, espera un momento.`,
				},
				{ quoted: msg },
			);
			for (const s of stickers) {
				const file = await axios.get(
					`https://api.telegram.org/bot${token}/getFile?file_id=${s.file_id}`,
				);
				const st = await axios.get(
					`https://api.telegram.org/file/bot${token}/${file.data.result.file_path}`,
					{ responseType: "arraybuffer" },
				);
				let result;
				if (file.data.result.file_path.endsWith(".tgs")) {
					const url = await tgsConverter(st.data);
					const buffer = await axios.get(url, {
						responseType: "arraybuffer",
					});
					result = await sticker(buffer.data).catch(async (e) => {
						await errorHandler(sock, msg, "stelegram", e);
					});
				} else {
					result = await sticker(st.data).catch(async (e) => {
						await errorHandler(sock, msg, "stelegram", e);
					});
				}
				await sock
				.sendMessage(msg.key.remoteJid, { sticker: result }, { quoted: msg })
				.catch(async (e) => {
					await errorHandler(sock, msg, "stelegram", e);
				});
			}
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `stelegram`,
	alias: [`st`],
	type: `misc`,
	description: `Envia stickers de un paquete de stickers de Telegram.`,
};
