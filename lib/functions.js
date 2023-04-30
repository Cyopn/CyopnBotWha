const fs = require("fs");
const sleep = require("ko-sleep");
const db = require("megadb");

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
			let dbs = new db.crearDB({
				nombre: "dataDesc",
				carpeta: "./database",
			});
			if (!dbs.has(r.id.replace("@g.us", ""))) {
				dbs.set(r.id.replace("@g.us", ""), {
					welcome: false,
					level: false,
				});
			}
		}
	});
};

module.exports = {
	getCommands,
	loadDatabase,
};
