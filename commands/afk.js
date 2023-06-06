const { prefix } = require("../config.json");
const db = require("megadb");
let dba = new db.crearDB({
	nombre: "dataAfk",
	carpeta: "./database",
});

module.exports.run = async (client, message, args) => {
	const { id, from, author, isGroupMsg } = message;
	const arg = args[0].join(" ");
	if (!isGroupMsg)
		return await client.reply(
			from,
			`Comando solo disponible en grupos.`,
			id
		);
	const groupId = isGroupMsg ? from.replace("@g.us", "") : "";
	const userId = author.replace("@c.us", "");
	if (!arg)
		return await client.reply(
			from,
			`Es necesario proporcionar un texto, escribe ${prefix}afk (texto), si tienes dudas sobre este comando escribe ${prefix}help afk.`,
			id
		);

	if (dba.has(`${groupId}.${userId}`)) {
		const { status } = await dba.get(`${groupId}.${userId}`);
		if (status === "dep") {
			await client.reply(
				from,
				`Acada de terminar tu tiempo inactivo, intenta de nuevo.`,
				id
			);
			dba.set(`${groupId}.${userId}`, {
				status: "none",
				reason: "",
			});
		} else {
			dba.set(`${groupId}.${userId}`, {
				status: "afk",
				reason: arg,
			});
			await client.reply(
				from,
				`Se ha establecido tu periodo de inactividad.\nRazon: _${arg}_.\nTerminara cuando vuelvas a enviar un mensaje.`,
				id
			);
		}
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `afk`,
	alias: `af`,
	type: `misc`,
	description: `Establece un periodo en el que no estes disponible, usa ${prefix}afk (razon de inactividad), recuerda que no es necesario escribir los parentesis, el periodo termina despues de enviar un mensaje.`,
	fulldesc: `Usa este comando para establecer tu inactividad dentro de un grupo, puedes usar ${prefix}afk (razon) o su alias ${prefix}af (razon), cada que otro participante del grupo te mecione, recibira una respuesta con la razon de tu inactividad, termina despues de enviar un mensaje. \nComando solo disponible en grupos.`,
};
