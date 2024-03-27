require("dotenv").config();
const { prefix, owner } = process.env;
const { crearDB } = require("megadb");
const db = new crearDB({
	nombre: "afk",
	carpeta: "./database",
});
module.exports.run = async (sock, msg, args) => {
	const arg = args[0].join(" ");
	if (!arg)
		return await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario proporcionar un texto, escribe ${prefix} (texto), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help.`,
			},
			{ quoted: msg },
		);
	try {
		if (!msg.key.remoteJid.includes("g.us"))
			return sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Comando solo disponible en grupos.`,
				},
				{ quoted: msg },
			);
		const { remoteJid, participant } = msg.key;
		const gid = remoteJid.split("@")[0];
		const uid =
			participant !== undefined
				? participant.split("@")[0]
				: remoteJid.split("@")[0];
		if (db.has(`${gid}.${uid}`)) {
			const { status } = await db.get(`${gid}.${uid}`);
			if (status === "dep") {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Acada de terminar tu tiempo inactivo, intenta de nuevo.`,
					},
					{ quoted: msg },
				);
				db.set(`${gid}.${uid}`, {
					status: "none",
					reason: "",
				});
			} else {
				db.set(`${gid}.${uid}`, {
					status: "afk",
					reason: arg,
				});
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Se ha establecido tu periodo de inactividad.\nRazon: _${arg}_.\nTerminara cuando vuelvas a enviar un mensaje.`,
					},
					{ quoted: msg },
				);
			}
		} else {
			db.set(`${gid}.${uid}`, {
				status: "afk",
				reason: arg,
			});
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Se ha establecido tu periodo de inactividad.\nRazon: _${arg}_.\nTerminara cuando vuelvas a enviar un mensaje.`,
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
	name: `afk`,
	alias: `af`,
	type: `misc`,
	description: `Establece tu estado de inactividad.`,
	fulldesc: ``,
};
