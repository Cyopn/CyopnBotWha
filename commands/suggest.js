require("dotenv").config();
const { prefix, owner } = process.env;
const { crearDB } = require("megadb");
const db = new crearDB({
	nombre: "suggest",
	carpeta: "./database",
});
module.exports.run = async (sock, msg, args) => {
	try {
		if (args[1] !== undefined || args[0].join(" ").length > 1) {
			const { remoteJid, participant } = msg.key;
			const gid = remoteJid.split("@")[0];
			const uid =
				participant !== undefined
					? participant.split("@")[0]
					: remoteJid.split("@")[0];
			const date = new Date();
			await db.set(
				`${gid}.${uid}-${date.getDate()}/${
					date.getUTCMonth() + 1
				}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
				{
					suggest: args[0].join(" "),
					suggestQuoted:
						args[1] !== undefined
							? args[1].join(" ")
							: "No hay mensaje citado",
				},
			);
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Sugerencia enviada correctamente, gracias por tu aporte.`,
				},
				{ quoted: msg },
			);
		} else {
			return await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Es necesario proporcionar un texto, escribe ${prefix}suggest (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help.`,
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
	name: `suggest`,
	alias: `sg`,
	type: `misc`,
	description: `Envia una sugerencia al desarrollador.`,
	fulldesc: `Si tienes alguna idea para mejorar el bot, puedes enviarla con este comando, escribe ${prefix}suggest (enlace), o con su alias ${prefix}sg (enlace), recuerda que no es necesario escribir los parentesis. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
