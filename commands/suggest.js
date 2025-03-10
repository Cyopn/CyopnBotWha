require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
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
				`${gid}.${uid}-${date.getDate()}/${date.getUTCMonth() + 1
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
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `suggest`,
	alias: [`sg`],
	type: `misc`,
	description: `Envia una sugerencia al desarrollador.`,};
