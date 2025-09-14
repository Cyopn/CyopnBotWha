require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");

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
		await sock.groupMetadata(msg.key.remoteJid)).participants.some(e => {
			return e.jid === (sock.user.id).replace((sock.user.id).substring(sock.user.id.indexOf(":"), sock.user.id.indexOf("@")), "") && e.admin != null
		})

	const isAdmin = (
		await sock.groupMetadata(msg.key.remoteJid)
	).participants.some(
		(e) => e.id === msg.key.participant && e.admin !== null,
	);

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
			if (u.includes(sock.user.id.slice(0, sock.user.id.indexOf(":")))) {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `No puedo degradarme a mi mismo.`,
					},
					{ quoted: msg },
				);
			} else {
				u = u.replace("@", "").concat("@s.whatsapp.net");
				lu.push(u);
			}
		}
		const response = await sock.groupParticipantsUpdate(
			msg.key.remoteJid,
			lu,
			"remove",
		);
		if (response.length > 0 && response[0].status == 200) {
			sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Se ha(n) eliminado a usuario(s) exitosamente:
${lu.map((e) => `@${e.replace("@s.whatsapp.net", "")}`).join("\n")}`,
					mentions: lu,
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `remove`,
	alias: [`ban`],
	type: `misc`,
	description: `Elimina a uno o mas miembros del grupo, es necesario mencionar o etiquetar algun miembro del grupo.`,
};
