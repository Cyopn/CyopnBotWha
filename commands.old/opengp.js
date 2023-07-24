const { prefix } = require("../config.json");

module.exports.run = async (client, message) => {
	const { id, from, sender, isGroupMsg } = message;
	const groupId = isGroupMsg ? from : "";
	const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : "";
	const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false;
	let selfAdmin = await client.iAmAdmin();

	if (!isGroupMsg)
		return await client.reply(
			from,
			`Comando solo disponible en grupos.`,
			id
		);
	if (selfAdmin.indexOf(groupId) === -1)
		return await client.reply(
			from,
			`Comando solo disponible si soy administrador del grupo.`,
			id
		);
	if (!isGroupAdmins)
		return await client.reply(
			from,
			`Comando solo disponible para administradores del grupo.`,
			id
		);
	await client.setGroupToAdminsOnly(groupId, false);
	await client.reply(
		from,
		`A partir de ahora, el grupo esta disponible para todos los participantes.`,
		id
	);
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `opengp`,
	alias: `opp`,
	type: `adm`,
	description: `Cambia los ajustes del grupo para que todos los participantes puedan enviar mensajes, es necesario que sea administrador de grupo.`,
	fulldesc: `Cambia los ajustes del grupo para que todos los participantes puedan enviar mensajes (si el grupo esta disponible solo para administradores), para ello, tambien es necesario que sea administrador del grupo.\nComando solo disponible en grupos.`,
};
