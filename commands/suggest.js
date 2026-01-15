require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { saveSuggest } = require("../lib/db");

module.exports.run = async (sock, msg, args) => {
	try {
		if (args[1] !== undefined || args[0].join(" ").length > 1) {
			const { remoteJid, participant } = msg.key;
			const gid = remoteJid.split("@")[0];
			const uid =
				participant !== undefined
					? participant.split("@")[0]
					: remoteJid.split("@")[0];
			await saveSuggest(gid, uid, args[0].join(" "), args[1]);
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Sugerencia enviada correctamente. Gracias por tu aporte.`,
				},
				{ quoted: msg },
			);
		} else {
			return await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Es necesario proporcionar un texto. Escribe ${prefix}suggest (texto). No es necesario escribir los paréntesis. Si tienes dudas sobre este comando, escribe ${prefix}help.`,
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
	description: `Envía una sugerencia al desarrollador.`,
};
