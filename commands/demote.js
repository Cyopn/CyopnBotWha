require("dotenv").config();
const { prefix, owner } = process.env;
const axios = require("axios").default;

module.exports.run = async (sock, msg, args) => {
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
	).participants.some((e) => e.id === msg.key.participant);
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
	if (args[0].length <= 0 || !args[0].join("").includes("@"))
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario mencionar o etiquetar algun mienbro del grupo, escribe ${prefix}demote (miembro(s) mencionado(s)), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help prodem.`,
			},
			{ quoted: msg },
		);
	try {
		let lu = [];
		for (u of args[0]) {
			if (Number.isNaN(Number.parseInt(u.replace("@", ""))))
				return sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `No existe el miembro ${u}, es necesario mencionar o etiquetar algun mienbro del grupo, escribe ${prefix}prodem (miembro(s) mencionado(s)), recuerda que no es necesario escribir los parentesis, si tienes dudas sobre este comando escribe ${prefix}help prodem.`,
					},
					{ quoted: msg },
				);
			u = u.replace("@", "").concat("@s.whatsapp.net");
			const isAdmin = (
				await sock.groupMetadata(msg.key.remoteJid)
			).participants.some((r) => r.id === u && r.admin != null);
			if (isAdmin) {
				lu.push(u);
			} else {
				sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `El usuario @${u.replace(
							"@s.whatsapp.net",
							"",
						)} no es administrador.`,
						mentions: [`${u}`],
					},
					{ quoted: msg },
				);
			}
		}
		const response = await sock.groupParticipantsUpdate(
			msg.key.remoteJid,
			lu,
			"demote",
		);
		if (response.length > 0 && response[0].status == 200) {
			sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Se ha(n) degradado a usuario(s) exitosamente:
${lu.map((e) => `@${e.replace("@s.whatsapp.net", "")}`).join("\n")}`,
					mentions: lu,
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
	name: `demote`,
	alias: `dm`,
	type: `admin`,
	description: `Degreda a miembro a uno o mas administradores del grupo, es necesario mencionar o etiquetar algun miembro del grupo.`,
	fulldesc: `Comando para degredar a miembro a uno o mas administradores del grupo, es necesario mencionar o etiquetar algun miembro del grupo, , escribe ${prefix}demote (miembro(s)), recuerda que no es necesario escribir los parentesis.\nComnado disponible solo para grupos.`,
};
