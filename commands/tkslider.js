require("dotenv").config();
const { prefix, zenKey, owner } = process.env;
const axios = require("axios").default;
module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join("").length >= 1
			? args[0].join("")
			: args[1] === undefined
				? ""
				: args[1].join("");
	try {
		const response = await axios.request({
			method: 'GET',
			url: 'https://tiktok-scraper7.p.rapidapi.com/',
			params: {
				url: arg,
				hd: '1'
			},
			headers: {
				'x-rapidapi-key': '38211cd4dcmsh34d9a30b672d1bfp1b3e3cjsna306af72a23a',
				'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
			}
		});
		if (!response.data.data) return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "No se encontro el contenido.",
			},
			{ quoted: msg },
		);
		if (response.data.data.images) {
			response.data.data.images.forEach(async (rs) => {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						caption: "w",
						image: { url: rs },
					},
					{ quoted: msg },
				);
			})
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `tkslider`,
	alias: `tks`,
	type: `misc`,
	description: `Envia algun tiktok deslizable (imagenes) sin marca de agua.`,
	fulldesc: `Comando para descargar imagenes de un Tiktok deslizable, escribe ${prefix}tkslider (enlace), o con su alias ${prefix}tks (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tkslider, o su alias ${prefix}tks respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
