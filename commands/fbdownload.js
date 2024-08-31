require("dotenv").config();
const { prefix, owner } = process.env;
const { fbdl } = require("ruhend-scraper")

module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join("").length >= 1
			? args[0].join("")
			: args[1] === undefined
				? ""
				: args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}fbdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(/www.facebook.com|fb.watch/g);
	if (!isurl)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);

	try {
		const r = await fbdl(arg);
		if (!r.status) return await sock.sendMessage(msg.key.remoteJid, { text: "No se encontro el contenido." }, { quoted: msg });
		const data = r.data.find(i => i.resolution === "720p (HD)") || r.data.find(i => i.resolution === "360p (SD)");
		if (!data) return await sock.sendMessage(msg.key.remoteJid, { text: "No se encontro el contenido." }, { quoted: msg });
		await sock.sendMessage(
			msg.key.remoteJid,
			{ video: { url: data.url }, caption: "w" },
			{ quoted: msg },
		);
	} catch (e) {
		const sub = msg.key.remoteJid.includes("g.us")
			? await sock.groupMetadata(msg.key.remoteJid)
			: {
				subject: msg.key.remoteJid.replace(
					"@s.whatsapp.net",
					"",
				),
			};
		await sock.sendMessage(`${owner}@s.whatsapp.net`, {
			text: `Error en ${this.config.name} - ${sub.subject}\n${String(
				e,
			)}`,
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
	name: `fbdownload`,
	alias: `fbdl`,
	type: `misc`,
	description: `Envia el video de alguna publicacion de Facebook.`,
	fulldesc: `Comando para descargar videos de Facebook, escribe ${prefix}fbdownload (enlace), o con su alias ${prefix}fbdl (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}fbdownload, o su alias ${prefix}fbdl respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
