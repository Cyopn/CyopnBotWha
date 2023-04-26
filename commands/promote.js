const { prefix } = require("../config.json");

module.exports.run = async (client, message, args) => {
	const { id, from, mentionedJidList, author, isGroupMsg, chat } = message;
	const groupId = isGroupMsg ? chat.groupMetadata.id : "";
	let adm = await client.getGroupAdmins(groupId);
	let selfadm = await client.iAmAdmin();
	if (!isGroupMsg)
		return client.reply(from, "Comando solo disponible para grupos", id);
	if (selfadm.indexOf(groupId) == -1)
		return client.reply(
			from,
			"Para usar este comando debo ser administrador del grupo",
			id
		);
	if (adm.indexOf(author) == -1)
		return client.reply(
			from,
			"Para usar este comando debes ser administrador",
			id
		);
	if (mentionedJidList.length == 0) {
		await client.reply(
			from,
			`Debes mecionar a un usuario: _${prefix}promote @nose_`,
			id
		);
	} else {
		if (adm.indexOf(mentionedJidList[0]) != -1) {
			await client.reply(from, `El participante ya es administrador`, id);
		} else {
			await client.promoteParticipant(groupId, mentionedJidList[0]);
			await client.sendReplyWithMentions(
				from,
				`El participante @${mentionedJidList[0]} ha sido promovido a administrador`,
				id
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
	fulldesc: "",
};