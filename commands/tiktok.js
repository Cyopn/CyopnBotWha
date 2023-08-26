require("dotenv").config();
const { prefix, /*zenKey,*/ owner } = process.env;
//const axios = require("axios");
const { tiktokdl } = require("@bochilteam/scraper");

module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join(" ").length >= 1
			? args[0].join(" ")
			: args[1] === undefined
			? ""
			: args[1].join(" ");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}tiktok (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	/*
	Usando API Rest 
	const r = await axios.get(
		`https://api.zahwazein.xyz/downloader/musically?apikey=${zenKey}&url=${arg}`,
	); */
	const r = await tiktokdl(arg).catch((e) => {});
	if (r === undefined) {
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);
	} else {
		try {
			await sock.sendMessage(
				msg.key.remoteJid,
				{ video: { url: r.video.no_watermark_hd }, caption: "w" },
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
	}
};

module.exports.config = {
	name: `tiktok`,
	alias: `tk`,
	type: `misc`,
	description: `Envia algun tiktok sin marca de agua.`,
	fulldesc: `Comando para descargar videos de Tiktok, escribe ${prefix}tiktok (enlace), o con su alias ${prefix}tk (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tiktok, o su alias ${prefix}tk respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
