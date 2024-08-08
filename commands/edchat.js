require("dotenv").config();
const { prefix, owner } = process.env;

module.exports.run = async (sock, msg, args) => {
	try {
		if (!msg.key.remoteJid.includes("g.us"))
			return sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Comando solo disponible en grupos.`,
				},
				{ quoted: msg },
			);
		const imAdmin = (
			await sock.groupMetadata(msg.key.remoteJid)
		).participants.some(
			(e) =>
				e.id ===
				sock.user.id.substring(0, sock.user.id.indexOf(":")) +
				sock.user.id.substring(
					sock.user.id.indexOf("@"),
					sock.user.id.length,
				) && e.admin != null,
		);

		const isAdmin = (
			await sock.groupMetadata(msg.key.remoteJid)
		).participants.some(
			(e) => e.id === msg.key.participant && e.admin !== null,
		);

		const isClose = (await sock.groupMetadata(msg.key.remoteJid)).announce;

		if (!isAdmin)
			return sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Debes ser administrador para usar este comando.`,
				},
				{ quoted: msg },
			);
		if (!imAdmin)
			return sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Debo ser administrador para usar este comando.`,
				},
				{ quoted: msg },
			);
		await sock.groupSettingUpdate(
			msg.key.remoteJid,
			isClose ? "not_announcement" : "announcement",
		);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: isClose
					? `A partir de ahora, el grupo esta disponible para todos los miembros del grupo.`
					: `A partir de ahora, el grupo esta disponible solo para los administradores del grupo.`,
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
	name: `edchat`,
	alias: `edc`,
	type: `misc`,
	description: `Cambia el estado del chat a solo administradores o a todos los miembros del grupo.`,
	fulldesc: `Comnado para cambiar los ajustes del chat a solo administradores o a todos los miembros del grupo, escribe ${prefix}edchat.\nComando disponible solo para grupos.`,
};
