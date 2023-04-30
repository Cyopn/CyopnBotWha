const { prefix } = require("../config.json");
const db = require("megadb");
let dbs = new db.crearDB({
	nombre: "dataDesc",
	carpeta: "./database",
});

module.exports.run = async (client, message, args) => {
	const { id, from, sender, isGroupMsg, chat } = message;
	const arg = args[0].join("");
	const groupId = isGroupMsg
		? chat.groupMetadata.id.replace("@g.us", "")
		: "";
	const groupAdmins = isGroupMsg
		? await client.getGroupAdmins(groupId.concat("@g.us"))
		: "";
	const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false;
	if (!isGroupMsg)
		return await client.reply(
			from,
			`Comando solo disponible en grupos.`,
			id
		);
	if (!isGroupAdmins)
		return await client.reply(
			from,
			`Comando solo disponible para administradores.`
		);
	if (!dbs.has(groupId)) {
		dbs.set(groupId, {
			welcome: false,
			level: false,
		});
	}

	if (!arg)
		return await client.reply(
			from,
			`Escribe alguna de las opciones existentes: \nwelcome \nlevel \nSi tienes dudas escribe ${prefix}help ${this.config.name}.`,
			id
		);
	switch (arg) {
		case "welcome":
			const r = await dbs.get(groupId);
			if (r.welcome) {
				dbs.set(groupId, {
					welcome: false,
					level: r.level,
				});
				await client.reply(
					from,
					`Se ha desactivado el mensaje de bienvenida.`,
					id
				);
			} else {
				await client.reply(
					from,
					`La bienvenida ya se encontraba desactivada.`,
					id
				);
			}
			break;
		case "level":
			const t = await dbs.get(groupId);
			if (t.level) {
				dbs.set(groupId, {
					welcome: t.welcome,
					level: false,
				});
				await client.reply(
					from,
					`Se ha desactivado el sistema de niveles.`,
					id
				);
			} else {
				await client.reply(
					from,
					`El sistema de niveles ya se encontraba desactivado.`,
					id
				);
			}
			break;
		default:
			await client.reply(
				from,
				`La opcion _${arg}_ no existe, escribe alguna de las opciones existentes: \nwelcome \nlevel \nSi tienes dudas escribe ${prefix}help ${this.config.name}.`,
				id
			);
			break;
	}
	await client.simulateTyping(from, true);
};

module.exports.config = {
	name: `deact`,
	alias: `dt`,
	type: `adm`,
	descripcion: `Desactiva algunas funciones extra en grupos (mensaje de bienvenida y sistema de niveles, estaran desactivados por defecto).`,
	fulldesc: `Este comando funciona para deshabilitar funciones adicionales (mensaje de bienvenida y sistema de niveles, estaran desactivados por defecto), es necesario escribir ${prefix}deact (welcome o level), recuerda que no debes escribir los corchetes, solo la opcion, ejemplo: _${prefix}deact level_, de este modo se desactivara el sistema de niveles. \nComando solo disponible en grupos.`,
};
