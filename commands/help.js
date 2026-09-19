require("dotenv").config();
const { prefix, channel } = process.env;
const { getCommands } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
	const { command, alias, type, desc, fulldesc } = await getCommands();
	let txt = `*CyopnBot* 
	*Prefijo*: [  ${prefix}  ] 
	_yo_ : https://instagram.com/Cyopn_
	Sigue el canal de información para estar al día de las novedades y actualizaciones: ${channel}

	*Información*
	Escribe ${prefix} seguido de cualquiera de los comandos. Puedes usar el nombre del comando o su alias.
	_Uso: ${prefix}[Comando] [Texto/Enlace/Otros]_
	Se deben sustituir los paréntesis/corchetes según corresponda.
	_Ejemplo: ${prefix}attp Hola_

	*Comandos disponibles*:`;
	command.forEach((name) => {
		const sr = command.indexOf(name);
		if (type[sr] === "ign" || type[sr] === "admin") return;
		txt += `\n*${name}* (alias: ${alias[sr].toString().replaceAll(",", ", ")})\n_${desc[sr]}_
`;
	});
	sock.sendMessage(
		msg.key.remoteJid,
		{
			text: txt,
		},
		{ quoted: msg },
	);
	txt = "";
};

module.exports.config = {
	name: "help",
	alias: [`h`, `ayuda`, `comandos`, `auxilio`, `socorro`],
	type: "help",
	description: `Muestra este mensaje.`,
};
