const { prefix } = require("../config.json");

module.exports.run = async (client, message) => {
	const { id, from, mentionedJidList, sender, isGroupMsg } = message;
	const groupId = isGroupMsg ? from : "";
	const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : "";
	const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false;
	let selfAdmin = await client.iAmAdmin();
	if (!isGroupMsg)
		return client.reply(from, "Comando solo disponible en grupos.", id);
	if (selfAdmin.indexOf(groupId) === -1)
		return client.reply(
			from,
			"Comando solo disponible si soy administrador del grupo.",
			id,
		);
	if (!isGroupAdmins)
		return client.reply(
			from,
			"Comando solo disponible para administradores del grupo.",
			id,
		);
	if (mentionedJidList.length == 0) {
		await client.reply(
			from,
			`Debes mecionar a un usuario: _${prefix}promote @nose_.`,
			id,
		);
	} else {
		if (adm.indexOf(mentionedJidList[0]) != -1) {
			await client.reply(
				from,
				`El participante ya es administrador.`,
				id,
			);
		} else {
			await client.promoteParticipant(groupId, mentionedJidList[0]);
			await client.sendReplyWithMentions(
				from,
				`El participante @${mentionedJidList[0]} ahora es administrador.`,
				id,
			);
		}
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "promote",
	alias: "pr",
	type: "adm",
	description: "Promueve a un participante a administrador de grupo.",
	fulldesc: `Este comando es util para llevar la administracion de grupos, escribiendo el prefijo ${prefix} mientras etiquetas al participante del grupo que quieras hacer administrador.\nEste comando solo se puede usar en grupos.`,
};
