const { loadCommands } = require("../lib/functions");
const fs = require("fs");
let path;

module.exports.run = async (client, message, args, config) => {
	let { from, id } = message;
	const { prefix } = config;
	let pathh = "nose";
	try {
		path = `       *CyopnBot* 
*Informacion*
*Prefijo*: [  ${prefix}  ]
_yo_ : https://instagram.com/Cyopn_

Escribe ${prefix} seguido de cualquiera de los comandos, recuerda que puedes usar el nombre del comando o su alias
_Uso: ${prefix}[Comando] [Argumentos/Texto/Enlace/Otros]_
Se deben sustituir los corchetes segun corresponda
_Ejemplo: ${prefix}attp Hola_
*Comandos*: 

*Nuevo:*
*fbdownload* (alias: fbdl)
_Descarga algun video de facebook, Uso: ${prefix}play [url]_

*afk* (alias: af)
_Establece tiempo en el que no estes disponible_

*attp* (alias: ap)
_Envia un sticker animado a partir de un texto escrito: ${prefix}attp hola_

*igdownload* (alias: igdl)
_Obten multimedia de una publicacion de instagram_

*imageia* (alias: ima)
_Genera imagenes con inteligencia artificial_

*join* (alias: j)
_Añade el bot a un grupo con solo un comando_

*lang* (alias: la)
_Muestra la lista de idiomas disponibles para el comando !tts_

*level* (alias: lvl)
_Obten informacion sobre tu nivel y experiencia_

*meme* (alias: m)
_Momazos en r/ChingaTuMadreNoko_
Conviertete en colaborador aqui: https://www.reddit.com/r/ChingaTuMadreNoko/
El usar este comando repetidamente puede causar el que el bot deje de funcionar

*play* (alias: p)
_Descarga alguna cancion de youtube, Uso: ${prefix}play [url/consulta]_

*sticker* (alias: s)
_Crea stickers estaticos o animados_

*suggest* (alias: sg)
_Envia una sugerencia para el desarrollo del bot_

*suport* (alias: sp)
_Obten ayuda si existe algun problema_

*tiktok* (alias: tk)
_Descarga algun tiktok sin marca de agua_
Algunos pueden ser enviados como documentos, pues son enviados en la mejor calidad disponible

*toimg* (alias: ti)
_Convierte un sticker a imagen_

*tts* (alias: tts)
_Envia audios en un lenguaje especifico_

*twitter* (alias: tw)
_Descarga algun video de twitter_

*videodl* (alias: vd)
_Descarga un video corto de youtube, *En construccion*_`;

		await client.reply(from, path, id);
	} catch (e) {
		console.error(
			`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
			e.toString()
		);
		await client.reply(from, `Ocurrio un error`, id);
	}
	/* let txt = `*CyopnBot* 
*Prefijo*: [  ${prefix}  ] 
_yo_ : https://instagram.com/Cyopn_

*Informacion*
Escribe ${prefix} seguido de cualquiera de los comandos, recuerda que puedes usar el nombre del comando o su alias
_Uso: ${prefix}[Comando] [Texto/Enlace/Otros]_
Se deben sustituir los corchetes segun corresponda
_Ejemplo: ${prefix}attp Hola_
  
*Comandos*:`;
	let command = [];
	let alias = [];
	let type = [];
	let desc = [];
	fs.readdir("./commands/", (err, files) => {
		if (err) return console.error(err);
		let jsfile = files.filter((f) => f.split(".").pop() === "js");
		if (jsfile.length <= 0)
			return console.log("No se encontro ningun comando");
		jsfile.forEach((f) => {
			let pull = require(`../commands/${f}`);
			command.push(pull.config.name);
			alias.push(pull.config.alias);
			//type.push(pull.config.type);
			desc.push(pull.config.desc);
		});
		command.forEach((name) => {
			const sr = command.indexOf(name);
			//if (type[sr] === "ign" || type[sr] === "adm") return;
			if (
				name === "test" ||
				name === "spotify" ||
				name === "help" ||
				name === "hornycard" ||
				name === "simpcard"
			)
				return;
			txt += `\n*${name}* (alias: ${alias[sr]})\n_${desc[sr]}_
`;
		});
		client.reply(from, txt, id);
		txt = "";
	}); */
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "help",
	alias: "h",
	desc: "nada",
};
