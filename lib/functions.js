const fs = require("fs");
const sleep = require("ko-sleep");
const db = require("megadb");
const { prefix } = require("../config.json");
let dbs = new db.crearDB({
	nombre: "dataDesc",
	carpeta: "./database",
});
let dbl = new db.crearDB({
	nombre: "dataLevel",
	carpeta: "./database",
});

/**
 * Funcion asincrona para obtener los comandos existententes en el directorio ./commands.
 * @returns Diccionario con todos los comandos con su respectivo alias, tipo, descripcion y descripcion detallada.
 */
const getCommands = async () => {
	let command = [];
	let alias = [];
	let type = [];
	let desc = [];
	let fulldesc = [];
	fs.readdir("./commands/", (err, files) => {
		if (err) return console.error(err);
		let jsfile = files.filter((f) => f.split(".").pop() === "js");
		if (jsfile.length <= 0)
			return console.log("No se encontro ningun comando");
		jsfile.forEach((f) => {
			let pull = require(`../commands/${f}`);
			command.push(pull.config.name);
			alias.push(pull.config.alias);
			type.push(pull.config.type);
			desc.push(pull.config.description);
			fulldesc.push(pull.config.fulldesc);
		});
	});
	await sleep(1 * 1000);
	const dict = {
		command: command,
		alias: alias,
		type: type,
		desc: desc,
		fulldesc: fulldesc,
	};
	return dict;
};

/**
 * Carga los grupos en la base de datos.
 * @param {Object} client Cliente/bot
 */
const loadDatabase = async (client) => {
	const a = await client.getAllChats();
	a.forEach((r) => {
		if (r.isGroup) {
			if (!dbs.has(r.id.replace("@g.us", ""))) {
				dbs.set(r.id.replace("@g.us", ""), {
					welcome: false,
					level: false,
				});
			}
		}
	});
};

/**
 * Sistema de niveles
 * @param {Object} client Cliente/bot
 * @param {Object} message Mensaje recibido
 */
const evalLevel = async (client, message) => {
	const { from, sender, author, isGroupMsg, body } = message;
	if (!isGroupMsg) return;
	const groupId = isGroupMsg ? from.replace("@g.us", "") : "";
	const sid = author.replace("@c.us", "");
	const sxp = parseInt(((Math.random() * body.length) / 10).toFixed(0)) + 1;
	const r = await dbs.get(groupId);
	if (r.level) {
		if (
			message.fromMe ||
			message.isMedia ||
			message.type === "image" ||
			message.type === "sticker" ||
			message.type === "ptt"
		)
			return;
		if (dbl.has(groupId) && dbl.has(`${groupId}.${sid}`)) {
			let { xp, level } = await dbl.get(`${groupId}.${sid}`);
			let lvlup = 5 * level ** 2 + 50 * level + 100;

			if (parseInt(xp) + parseInt(sxp) >= lvlup) {
				await dbl.set(`${groupId}.${sid}`, {
					xp: parseInt(xp) + parseInt(sxp) - parseInt(lvlup),
					level: parseInt(level),
				});
				let a = await dbl.get(`${groupId}.${sid}`);
				await client.sendTextWithMentions(
					from,
					`Felicidades @${sender.id} has avanzado de nivel: ${a.level} \n¡Sigue asi!¨\nUsa _${prefix}rank_ para ver la tabla de clasificacion.`
				);
			} else {
				await dbl.add(`${groupId}.${sid}.xp`, parseInt(sxp));
			}
		} else {
			await dbl.set(`${groupId}.${sid}`, {
				xp: parseInt(sxp),
				level: 1,
			});
		}
	}
};

module.exports = {
	getCommands,
	loadDatabase,
	evalLevel,
};
