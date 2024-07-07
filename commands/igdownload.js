require("dotenv").config();
const { prefix, owner } = process.env;
const axios = require("axios").default;

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
				text: `Debes proporcionar un enlace, escribe ${prefix}igdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(
		/(?:https?:\/\/)?(?:www.)?instagram.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p]+)?([reel]+)?([tv]+)?([stories]+)?\/([a-zA-Z0-9\-\_\.]+)\/?([0-9]+)?/gm,
	);
	if (!isurl)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `El enlace proporcionado no es valido.`,
			},
			{ quoted: msg },
		);

	try {
		const regExp = /\/p\/(.*?)\//;
		const regExp2 = /\/reel\/(.*?)\//;
		const shortcode = arg.match(regExp) === null ? arg.match(regExp2) : arg.match(regExp)
		if (shortcode === null) return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "No se pudo encontrar el contenido.",
			},
			{ quoted: msg },
		);

		const response = await axios.request({
			method: 'GET',
			url: 'https://instagram-scraper-2022.p.rapidapi.com/ig/post_info/',
			params: {
				shortcode: shortcode[1]
			},
			headers: {
				'x-rapidapi-key': '38211cd4dcmsh34d9a30b672d1bfp1b3e3cjsna306af72a23a',
				'x-rapidapi-host': 'instagram-scraper-2022.p.rapidapi.com'
			}
		});
		if (!response.data.edge_sidecar_to_children) {
			if (response.data.is_video) {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						caption: "w",
						video: { url: response.data.video_url },
					},
					{ quoted: msg },
				);
			} else {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						caption: "w",
						image: { url: response.data.display_url },
					},
					{ quoted: msg },
				);
			}
		} else {
			response.data.edge_sidecar_to_children.edges.forEach(async (edge) => {
				if (edge.node.is_video) {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							video: { url: edge.node.video_url },
						},
						{ quoted: msg },
					);
				} else {
					await sock.sendMessage(
						msg.key.remoteJid,
						{
							caption: "w",
							image: { url: edge.node.display_url },
						},
						{ quoted: msg },
					);
				}
			});
		}

	} catch (e) {
		const sub = msg.key.remoteJid.includes("g.us")
			? await sock.groupMetadata(msg.key.remoteJid)
			: {
				subject: msg.key.remoteJid.replace("@s.whatsapp.net", ""),
			};
		await sock.sendMessage(`${owner}@s.whatsapp.net`, {
			text: `Error en ${this.config.name} - ${sub.subject}\n${String(e)}`,
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
