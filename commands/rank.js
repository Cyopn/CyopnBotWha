require("dotenv").config();
const { prefix, owner } = process.env;
const axios = require("axios").default;
const { errorHandler } = require("../lib/functions");
const db = require("megadb");
const dbl = new db.crearDB({
	nombre: "level",
	carpeta: "./database",
});
module.exports.run = async (sock, msg, args) => {
	let dbObj = {};
	const { remoteJid } = msg.key;
	const gid = remoteJid.split("@")[0];
	try {
		if (!remoteJid.includes("g.us"))
			return sock.sendMessage(
				msg.key.remoteJid,
				{
					text: `Comando solo disponible en grupos.`,
				},
				{ quoted: msg },
			);
		const name = (await sock.groupMetadata(remoteJid)).subject;
		let keys = await dbl.keys(`${gid}`);
		for (let i in keys) {
			let val = await dbl.get(`${gid}.${keys[i]}`);
			dbObj[keys[i]] = val;
		}
		let dbArray = [];
		for (let x in dbObj) {
			dbArray.push({
				id: x,
				xp: dbObj[x].xp,
				level: dbObj[x].level,
			});
		}
		dbArray.sort(function (a, b) {
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
		let text = "";
		let i = 0;
		let mentions = [];
		dbArray.forEach((k) => {
			i += 1;
			if (i <= 10) {
				text += `${i}-. @${k.id} ~ Nivel: ${k.level} ~ Experiencia: ${k.xp} \n`;
				mentions.push(`${k.id}@s.whatsapp.net`);
			}
		});
		console.log(mentions);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Tabla de clasificacion en *${name}* \n${text}`,
				mentions: mentions,
			},
			{ quoted: msg },
		);
	} catch (e) {
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `rank`,
	alias: `rk`,
	type: `misc`,
	description: `Mira la tabla de clasificacion en el grupo.`,
	fulldesc: `Comando para ver la tabla de clasificacion en el grupo, muestra los 10 primeros usuarios con mas experiencia y nivel.`,
};
