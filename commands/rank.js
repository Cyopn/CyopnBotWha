const db = require("megadb");
const lvldB = new db.crearDB({
	nombre: "dataLevel",
	carpeta: "./database",
});

module.exports.run = async (client, message) => {
	const { id, from, isGroupMsg, chat } = message;
	const { name } = chat;
	const groupId = isGroupMsg ? chat.groupMetadata.id : "";
	let b = {};

	try {
		if (!isGroupMsg)
			return client.reply(
				from,
				"Comando solo disponible para grupos",
				id
			);

		let keys = await lvldB.keys(`${groupId.replace("@g.us", "")}`);
		for (let i in keys) {
			let val = await lvldB.get(
				`${groupId.replace("@g.us", "")}.${keys[i]}`
			);
			b[keys[i]] = val;
		}
		let arregloX = [];
		for (let x in b) {
			arregloX.push({
				id: x,
				xp: b[x].xp,
				level: b[x].level,
			});
		}
		arregloX.sort(function (a, b) {
			if (a.level > b.level) {
				return -1;
			} else if (a.level < b.level) {
				return 1;
			} else {
				if (a.xp > b.xp) {
					return -1;
				} else if (a.xp < b.xp) {
					return 1;
				} else {
					return 0;
				}
			}
		});
		let msg = "";
		let j = 0;
		arregloX.forEach((k) => {
			j += 1;
			if (j <= 10) {
				msg += `${j}-. @${k.id} ~ Nivel: ${k.level} ~ Experiencia: ${k.xp} \n`;
			}
		});

		await client.sendTextWithMentions(
			from,
			`Tabla de clasificacion en ${name} \n${msg}`
		);
	} catch (e) {
		console.error(
			`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
			e.toString()
		);
		await client.reply(from, `Ocurrio un error`, id);
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "rank",
	alias: "rk",
	desc: "Clasificacion",
};
