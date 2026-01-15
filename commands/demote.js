require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
	if (!msg.key.remoteJid.includes("g.us"))
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Comando disponible solo en grupos.`,
			},
			{ quoted: msg }
		);
	const imAdmin = (
		await sock.groupMetadata(msg.key.remoteJid)
	).participants.some((e) => {
		return (
			e.jid ===
			sock.user.id.replace(
				sock.user.id.substring(
					sock.user.id.indexOf(":"),
					sock.user.id.indexOf("@")
				),
				""
			) && e.admin != null
		);
	});
	const isAdmin = (
		await sock.groupMetadata(msg.key.remoteJid)
	).participants.some((e) => e.id === msg.key.participant && e.admin !== null);
	if (!isAdmin)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes ser administrador para usar este comando.`,
			},
			{ quoted: msg }
		);
	if (!imAdmin)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debo ser administrador para usar este comando.`,
			},
			{ quoted: msg }
		);
	if (args[0].length <= 0 || !args[0].join("").includes("@"))
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Es necesario mencionar o etiquetar a algún miembro del grupo. Escribe ${prefix}demote (miembro(s) mencionado(s)). No es necesario escribir los paréntesis.`,
			},
			{ quoted: msg }
		);
	try {
		let lu = [];
		for (u of args[0]) {
			if (Number.isNaN(Number.parseInt(u.replace("@", ""))))
				return sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `No existe el miembro ${u}. Es necesario mencionar o etiquetar a algún miembro del grupo. Escribe ${prefix}demote (miembro(s) mencionado(s)). No es necesario escribir los paréntesis.`,
					},
					{ quoted: msg }
				);
			if (u.includes(sock.user.id.slice(0, sock.user.id.indexOf(":")))) {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `No puedo degradarme a mí mismo.`,
					},
					{ quoted: msg }
				);
			} else {
				u = (await sock.groupMetadata(msg.key.remoteJid)).participants.filter(
					(e) => {
						return e.jid ? e.lid.includes(u.replace("@", "")) : null;
					}
				)[0].jid;
				const isAdmin = (
					await sock.groupMetadata(msg.key.remoteJid)
				).participants.some((r) => {
					return r.jid === u && r.admin !== null;
				});
				if (isAdmin) {
					lu.push(u);
				} else {
					sock.sendMessage(
						msg.key.remoteJid,
						{
							text: `El usuario @${u.replace(
								"@s.whatsapp.net",
								""
							)} no es administrador.`,
							mentions: [`${u}`],
						},
						{ quoted: msg }
					);
				}
			}
		}
		const response = await sock.groupParticipantsUpdate(
			msg.key.remoteJid,
			lu,
			"demote"
		);
		if (response.length > 0 && response[0].status == 200) {
			sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Se ha(n) degradado correctamente a:
	${lu.map((e) => `@${e.replace("@s.whatsapp.net", "")}`).join("\n")}`,
					mentions: lu,
				},
				{ quoted: msg }
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `demote`,
	alias: [`dm`],
	type: `misc`,
	description: `Degrada a uno o más administradores a miembros del grupo. Es necesario mencionar o etiquetar a algún miembro del grupo.`,
};
