require("dotenv").config();
const { prefix } = process.env;
const axios = require('axios').default;
const { errorHandler } = require("../lib/functions");

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
	let formdata = new FormData();
	formdata.append("url", arg);
	let response = await axios.request({
		url: "https://api.tikmate.app/api/lookup",
		method: "POST",
		headers: {
			"Accept": "*/*",
		},
		data: formdata,
	}).catch((e) => { return e.response.data });
	if (response.success === false) {
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `No se pudo encontrar el contenido.`,
			},
			{ quoted: msg },
		);
	} else {
		try {
			await sock.sendMessage(
				msg.key.remoteJid,
				{ video: { url: `https://tikmate.app/download/${response.data.token}/${response.data.id}.mp4?hd=1` }, caption: "w" },
				{ quoted: msg },
			);
		} catch (e) {
			await errorHandler(sock, msg, this.config.name, e);
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
