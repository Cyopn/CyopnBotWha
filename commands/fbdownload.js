const { prefix } = require("../config.json");
const { facebookdlv2 } = require("@bochilteam/scraper");

module.exports.run = async (sock, msg, args) => {
	const arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}fbdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isUrl = arg.match(/www.facebook.com|fb.watch/g);
	if (!isUrl)
		return await client.reply(
			from,
			`El enlace proporcionado no es valido.`,
			id,
		);
	const r = await facebookdlv2(arg).catch((e) => {});
	if (r === undefined) {
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);
	} else {
		/*
		Filtro para la primera opcion (facebookdl) 
		const ma = r.result.filter(
			(rs) =>
				rs.ext === "mp4" &&
				!rs.url.includes("youtube4kdownloader") &&
				rs.isVideo,
		); */
		await sock.sendMessage(
			msg.key.remoteJid,
			{ video: { url: r.result[0].url }, caption: "w" },
			{ quoted: msg },
		);
	}
};

module.exports.config = {
	name: `fbdownload`,
	alias: `fbdl`,
	type: `misc`,
	description: `Envia el video de alguna publicacion de Facebook.`,
	fulldesc: `Comando para descargar videos de Facebook, escribe ${prefix}fbdownload (enlace), o con su alias ${prefix}fbdl (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}fbdownload, o su alias (${prefix})fbdl respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
