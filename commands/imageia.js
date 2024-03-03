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
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto, escribe ${prefix}imageia (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help imageia.`,
			},
			{ quoted: msg },
		);
	try {
		const response = await axios.get(
			`https://aemt.me/ai/text2img?text=${encodeURI(arg)}`,
			{
				responseType: "arraybuffer",
			},
		);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				caption: "w",
				image: response.data,
			},
			{ quoted: msg },
		);
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
	name: `imageia`,
	alias: `ima`,
	type: `misc`,
	description: `Genera imagenes con inteligencia artificial.`,
	fulldesc: `Comando para generar imagenes con inteligencia artificial, escribe ${prefix}imageia (texto), o con su alias ${prefix}ima (testo), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un texto ya enviado, usando ${prefix}imageia, o su alias ${prefix}ima respondiendo al texto. \nEste comando puede usarse en mensajes directos y/o grupos..`,
};
