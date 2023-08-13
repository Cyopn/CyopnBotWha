const { prefix } = require("../config.json");
const g = require("google-tts-api");

module.exports.run = async (sock, msg, args) => {
	const arg = args[1] === undefined ? args[0] : args[1];

	if (arg.length <= 0)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto, escribe ${prefix}tts [idioma (español por defecto)] [texto], recuerda que no es necesario escribir los corchetes, si tienes dudas sobre este comando escribe ${prefix}help tts.`,
			},
			{ quoted: msg },
		);
	if (arg.length === 1) {
		const r = g.getAudioUrl(arg.join(" "), {
			lang: "es",
			slow: false,
			host: "https://translate.google.com",
		});
		await sock
			.sendMessage(
				msg.key.remoteJid,
				{
					audio: { url: r },
				},
				{ quoted: msg },
			)
			.catch((e) => {});
	} else {
		const l = arg.shift();
		const t = arg.join(" ");
		const r = g.getAudioUrl(t, {
			lang: l,
			slow: false,
			host: "https://translate.google.com",
		});
		await sock
			.sendMessage(
				msg.key.remoteJid,
				{
					audio: { url: r },
				},
				{ quoted: msg },
			)
			.catch((e) => {
				console.log(e.code);
				if (e.code === "ERR_BAD_REQUEST") {
					const r = g.getAudioUrl(`${l} ${t}`, {
						lang: "es",
						slow: false,
						host: "https://translate.google.com",
					});
					sock.sendMessage(
						msg.key.remoteJid,
						{
							audio: { url: r },
						},
						{ quoted: msg },
					).catch((e) => {
						sock.sendMessage(
							msg.key.remoteJid,
							{
								text: `El servicio no esta disponible, Intenta mas tarde.`,
							},
							{ quoted: msg },
						);
					});
				}
			});
	}
};

module.exports.config = {
	name: `tts`,
	alias: `tts`,
	type: `misc`,
	description: `Crea un audio segun el texto proporcionado y en un idioma preferido (español por defecto), usa ${prefix}lang para ver los idiomas permitidos.`,
	fulldesc: `Comando para enviar audios en algun idioma preferido, usa este comando escribiendo ${prefix}[idioma (español por defecto)] [texto], recuerda que no es necesario escribir los corchetes, en caso de no escibir el idioma sera enviado en español. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
