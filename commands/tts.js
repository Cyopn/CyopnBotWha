require("dotenv").config();
const { prefix, owner } = process.env;
const { createAudioFile } = require("simple-tts-mp3")
const fs = require("fs");

module.exports.run = async (sock, msg, args) => {
	const lang = ["af", "sq", "de", "ar", "bn", "my", "bs", "bg", "km", "kn", "ca", "cs", "zh", "zh-TW", "si", "ko", "hr", "da", "sk", "es", "et", "fi", "fr", "el", "gu", "hi", "nl", "hu", "id", "en", "is", "it", "ja", "la", "lv", "ml", "ms", "mr", "ne", "no", "pl", "pt", "ro", "ru", "sr", "sw", "sv", "su", "tl", "th", "ta", "te", "tr", "uk", "ur", "vi"]
	const arg =
		args[1] === undefined && args[0].join(" ").length >= 1
			? args[0]
			: args[1] === undefined
				? ""
				: args[1];
	if (arg.length <= 0)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto, escribe ${prefix}tts [idioma (español por defecto)] [texto], recuerda que no es necesario escribir los corchetes, si tienes dudas sobre este comando escribe ${prefix}help tts.`,
			},
			{ quoted: msg },
		);

	try {
		if (lang.indexOf(arg[0]) != -1) {
			const ln = arg.shift()
			if (arg.length <= 0)
				return sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Es necesario proporcionar un texto, escribe ${prefix}tts [idioma (español por defecto)] [texto], recuerda que no es necesario escribir los corchetes, si tienes dudas sobre este comando escribe ${prefix}help tts.`,
					},
					{ quoted: msg },
				);
			const file = await createAudioFile(arg.join(" "), './temp/tts', ln).catch(async (e) => { await errorHandler(sock, msg, 'tts', e); });
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					audio: {
						url: file,
					},
					mimetype: "audio/mpeg",
				},
				{ quoted: msg },
			);
		} else {
			const file = await createAudioFile(arg.join(" "), './temp/tts', 'es').catch(async (e) => { await errorHandler(sock, msg, 'tts', e); });
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					audio: {
						url: file,
					},
					mimetype: "audio/mpeg",
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
	while (fs.existsSync(`./temp/tts.mp3`)) {
		fs.unlinkSync(`./temp/tts.mp3`);
	}

};

module.exports.config = {
	name: `tts`,
	alias: `tts`,
	type: `misc`,
	description: `Crea un audio segun el texto proporcionado y en un idioma preferido (español por defecto), usa ${prefix}lang para ver los idiomas permitidos.`,
	fulldesc: `Comando para enviar audios en algun idioma preferido, usa este comando escribiendo ${prefix}tts [idioma (español por defecto)] [texto], recuerda que no es necesario escribir los corchetes, en caso de no escibir el idioma sera enviado en español. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
