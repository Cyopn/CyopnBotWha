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
	await client.setGroupToAdminsOnly(groupId, true);
	await client.reply(
		from,
		`A partir de ahora, el grupo solo esta disponible para adminsitradores.`,
		id
	);
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `closegp`,
	alias: `clp`,
	type: `adm`,
	description: `Cambia los ajustes del grupo para que solo los administradores puedan enviar mensajes, es necesario que sea administrador de grupo.`,
	fulldesc: `Cambia los ajustes del grupo para que solo los administradores puedan enviar mensajes, para ello, tambien es necesario que sea administrador del grupo.\nComando solo disponible en grupos.`,
};
