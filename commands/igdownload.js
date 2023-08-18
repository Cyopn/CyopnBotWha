const { prefix, owner } = require("../config.json");
const ig = require("instagram-url-dl");

module.exports.run = async (sock, msg, args) => {
	const arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	const isUrl = arg.match(
		/(?:https?:\/\/)?(?:www.)?instagram.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p]+)?([reel]+)?([tv]+)?([stories]+)?\/([a-zA-Z0-9\-\_\.]+)\/?([0-9]+)?/gm,
	);
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}igdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	if (!isUrl)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);

	try {
		const r = await ig(arg);
		if (r.status) {
			r.data.forEach((i) => {
				if (i.type === "image") {
					sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							image: { url: i.url },
						},
						{ quoted: msg },
					);
				} else if (i.type === "video") {
					sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							video: { url: i.url },
						},
						{ quoted: msg },
					);
				}
			});
		} else {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `El servicio no esta disponible, Intenta mas tarde.`,
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await sock.sendMessage(`${owner}@s.whatsapp.net`, {
			text: String(e),
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
	name: `igdownload`,
	alias: `igdl`,
	type: `misc`,
	description: `Envia la mutimedia de alguna publicacion de Instagram.`,
	fulldesc: `Comando para descargar videos de Instagram, escribe ${prefix}igdownload (enlace), o con su alias ${prefix}igdl (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}igdownload, o su alias ${prefix}igdl respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
