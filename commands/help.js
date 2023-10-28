require("dotenv").config();
const { prefix, owner } = process.env;
const { getCommands } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
	const { command, alias, type, desc, fulldesc } = await getCommands();
	let txt = `*CyopnBot* 
*Prefijo*: [  ${prefix}  ] 
_yo_ : https://instagram.com/Cyopn_

*Informacion*
Escribe ${prefix} seguido de cualquiera de los comandos, recuerda que puedes usar el nombre del comando o su alias.
_Uso: ${prefix}[Comando] [Texto/Enlace/Otros]_
Se deben sustituir los parentesis segun corresponda.
_Ejemplo: ${prefix}attp Hola_

*Comandos disponibles*:`;
	const arg = args[0].join(" ");
	if (!arg) {
		command.forEach((name) => {
			const sr = command.indexOf(name);
			if (type[sr] === "ign" || type[sr] === "adm") return;
			txt += `\n*${name}* (alias: ${alias[sr]})\n_${desc[sr]}_
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
	} else {
		const cmd =
			command.indexOf(arg) === -1
				? alias.indexOf(arg)
				: command.indexOf(arg);
		if (cmd >= 0) {
			let txt = `Mas informacion sobre el comando: *${command[cmd]}*
Descripcion: ${fulldesc[cmd]}`;
			sock.sendMessage(
				msg.key.remoteJid,
				{
					text: txt,
				},
				{ quoted: msg },
			);
			txt = "";
		} else {
			switch (arg) {
				case "adm":
					command.forEach((name) => {
						const sr = command.indexOf(name);
						if (
							type[sr] === "ign" ||
							type[sr] === "misc" ||
							type[sr] === "help" ||
							type[sr] === "test"
						)
							return;
						txt += `\n*${name}* (alias: ${alias[sr]})\n_${desc[sr]}_
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
					break;
				default:
					sock.sendMessage(
						msg.key.remoteJid,
						{
							text: txt,
						},
						{ quoted: msg },
					);
					sock.sendMessage(
						msg.key.remoteJid,
						{
							text: `El comando *${arg}* no existe.`,
						},
						{ quoted: msg },
					);
					break;
			}
		}
	}
};

module.exports.config = {
	name: "help",
	alias: "h",
	type: "help",
	description: `Muestra este mensaje, escribe ${prefix}help help para obtener mas informacion.`,
	fulldesc: `Este comando no solo funciona para obtener los comandos, si no, al escibir el nombre o alias de otro comando (${prefix}help sticker, incluso si lo usas con sus alias (${prefix}h s), mostrara mas detalles sobre su uso.\nEste comando lo puedes usar en grupos y mensajes directos.`,
};
