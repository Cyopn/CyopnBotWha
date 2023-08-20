const { prefix, owner } = require("../config.json");

module.exports.run = async (sock, msg, args) => {
	const arg =
		args[1] === undefined && args[0].join("").length === 0
			? args[0].join("")
			: args[1].join("");
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
		if (String(e).includes("not-authorized")) {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: "Imposible unirse, al parecer he sido elimindo recientemente.",
				},
				{ quoted: msg },
			);
		} else {
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
	}
};

module.exports.config = {
	name: `join`,
	alias: `j`,
	type: `misc`,
	description: ``,
	fulldesc: ``,
};
