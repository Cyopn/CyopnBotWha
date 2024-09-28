require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const { prefix, owner } = process.env;

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
				text: `Debes proporcionar un enlace, escribe ${prefix}join (enlace), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(
		/^(https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]{22})$/,
	);
	if (!isurl)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "El enlace proporcionado no es valido.",
			},
			{ quoted: msg },
		);
	try {
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "Entrando...",
			},
			{ quoted: msg },
		);
		const metadata = await sock.groupAcceptInvite(
			arg.replace("https://chat.whatsapp.com/", ""),
		);
		if (metadata === undefined) {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: "Se ha enviado la solicitud para unirse.",
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		if (String(e).includes("not-authorized")) return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "Imposible unirse, al parecer he sido elimindo recientemente.",
			},
			{ quoted: msg },
		);
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `join`,
	alias: `j`,
	type: `misc`,
	description: `Agregame a un grupo solo con el enlace de invitacion del grupo.`,
	fulldesc: `Comando para agregarme a un grupo con su enlace de invitacion, escribe ${prefix}join (enlace), o con su alias ${prefix}join (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}join, o su alias ${prefix}j respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
