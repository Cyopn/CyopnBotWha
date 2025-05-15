//Importaciones de .
require("dotenv").config();
const { prefix, channel } = process.env;
const { errorHandler, getCommands } = require("../lib/functions");

module.exports.run = async (client, message, args) => {
	const arg =
		args[1] === undefined && args[0].join(" ").length >= 1
			? args[0].join(" ")
			: args[1] === undefined
				? ""
				: args[1].join(" ");
	try {
		const { command, alias, type, desc } = await getCommands();
		let txt = `*CyopnBot* 
*Prefijo*: [  ${prefix}  ] 
_yo_ : https://instagram.com/Cyopn_
Sigue el canal de informacion para estar al dia de las novedades y actualizaciones: ${channel}

*Informacion*
Escribe ${prefix} seguido de cualquiera de los comandos, recuerda que puedes usar el nombre del comando o su alias.
_Uso: ${prefix}[Comando] [Texto/Enlace/Otros]_
Se deben sustituir los parentesis/corchetes segun corresponda.
_Ejemplo: ${prefix}attp Hola_

*Comandos disponibles*:`;
		command.forEach((name) => {
			const sr = command.indexOf(name);
			if (type[sr] === "ign" || type[sr] === "admin") return;
			txt += `\n*${name}* (alias: ${alias[sr].toString().replaceAll(",", ", ")})\n_${desc[sr]}_
`;
		});
		await client.reply(message.from, txt, message.id);
		txt = "";
	} catch (e) {
		await errorHandler(client, message, this.config.name, e);
	}
};

module.exports.config = {
	name: `help`,
	alias: [`h`, `ayuda`],
	type: `help`,
	description: `Muestra este mensaje.`,
};
