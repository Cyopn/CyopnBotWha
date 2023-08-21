require("dotenv").config();
const { prefix, zenKey, owner } = process.env;
const { get } = require("axios").default;
module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join("").length === 0
			? args[0].join("")
			: args[1].join("");
	try {
		const r = await get(
			`https://api.zahwazein.xyz/downloader/ttslide?apikey=${zenKey}&url=${arg}`,
		);

		if (r.data.status === "OK") {
			if (r.data.result.length > 0) {
				r.data.result.forEach((rs) => {
					sock.sendMessage(
						msg.key.remoteJid,
						{ image: { url: rs }, caption: "w" },
						{ quoted: msg },
					);
				});
			} else {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `El enlace no es valido o no no contiene imagenes.`,
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
};

module.exports.config = {
	name: `tkslider`,
	alias: `tks`,
	type: `misc`,
	description: `Envia algun tiktok deslizable (imagenes) sin marca de agua.`,
	fulldesc: `Comando para descargar imagenes de un Tiktok deslizable, escribe ${prefix}tkslider (enlace), o con su alias ${prefix}tks (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tkslider, o su alias ${prefix}tks respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
