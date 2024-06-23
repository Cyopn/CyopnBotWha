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
		const response = await axios.get(
			`https://aemt.me/download/tiktokslide?url=${encodeURI(arg)}`,
		);
		if (response.data.status) {
			if (response.data.result.totalSlide < 1) {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `El enlace no es valido o no no contiene imagenes.`,
					},
					{ quoted: msg },
				);
			} else {
				response.data.result.images.forEach((rs) => {
					sock.sendMessage(
						msg.key.remoteJid,
						{ image: { url: rs }, caption: "w" },
						{ quoted: msg },
					);
				});
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						audio: {
							url: response.data.result.audio,
						},
						mimetype: "audio/mpeg",
					},
					{ quoted: msg },
				);
			}
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
	name: `tkslider`,
	alias: `tks`,
	type: `misc`,
	description: `Envia algun tiktok deslizable (imagenes) sin marca de agua.`,
	fulldesc: `Comando para descargar imagenes de un Tiktok deslizable, escribe ${prefix}tkslider (enlace), o con su alias ${prefix}tks (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tkslider, o su alias ${prefix}tks respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
