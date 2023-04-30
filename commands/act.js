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
				await client.reply(
					from,
					`La bienvenida ya se encontraba activada.`,
					id
				);
			} else {
				dbs.set(groupId, {
					welcome: true,
					level: r.level,
				});
				await client.reply(
					from,
					`Se ha activado el mensaje de bienvenida.`,
					id
				);
			}
			break;
		case "level":
			const t = await dbs.get(groupId);
			if (t.level) {
				await client.reply(
					from,
					`El sistema de niveles ya se encontraba activado.`,
					id
				);
			} else {
				dbs.set(groupId, {
					welcome: t.welcome,
					level: true,
				});
				await await client.reply(
					from,
					`La opcion ${arg} no existe, escribe alguna de las opciones existentes: \nwelcome \nlevel \nSi tienes dudas escribe ${prefix}help ${this.config.name}.`,
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
	name: `act`,
	alias: `at`,
	type: `adm`,
	descripcion: `Activa algunas funciones extra en grupos (mensaje de bienvenida y sistema de niveles, estaran desactivados por defecto).`,
	fulldesc: `Este comando funciona para habilitar funciones adicionales (mensaje de bienvenida y sistema de niveles, estaran desactivados por defecto), es necesario escribir ${prefix}act (welcome o level), recuerda que no debes escribir los corchetes, solo la opcion, ejemplo: _${prefix}act level_, de este modo se activara el sistema de niveles. \nComando solo disponible en grupos.`,
};
