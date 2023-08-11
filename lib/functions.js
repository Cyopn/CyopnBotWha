const fs = require("fs");
const sleep = require("ko-sleep");
const db = require("megadb");
const ytdl = require("ytdl-core");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { prefix } = require("../config.json");
//const fetch =  import("node-fetch");
let FormData;
let Blob;
import("formdata-node").then((r) => {
	FormData = r.FormData;
	Blob = r.Blob;
});
const { JSDOM } = require("jsdom");

let dbs = new db.crearDB({
	nombre: "dataDesc",
	carpeta: "./database",
});
let dbl = new db.crearDB({
	nombre: "dataLevel",
	carpeta: "./database",
});
let dba = new db.crearDB({
	nombre: "dataAfk",
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
					`Felicidades @${sender.id} has avanzado de nivel: ${a.level} \n¡Sigue asi!¨\nUsa _${prefix}rank_ para ver la tabla de clasificacion.`,
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

/**
 * Obtiene el estado de un mienbro si esta en afk
 * @param {Object} groupId Clave del grupo
 * @param {*} userId Clave del usuario
 * @returns Indefinido si no esta en afk, la razon si no es asi
 */
const getAfk = async (groupId, userId) => {
	let r = undefined;
	if (dba.has(`${groupId}.${userId}`)) {
		const { status, reason } = await dba.get(`${groupId}.${userId}`);
		if (status === "afk") {
			r = reason;
		}
	}
	return r;
};

/**
 * Resuelva el estado de un miembro si esta en afk
 * @param {Object} groupId Clave del grupo
 * @param {Object} userId Clave del usuario
 * @returns Verdadero si se ha desactivado el afk, de lo contrario sea falso
 */
const solveAfk = async (groupId, userId) => {
	let r = false;
	if (dba.has(`${groupId}.${userId}`)) {
		const { status } = await dba.get(`${groupId}.${userId}`);
		if (status === "afk") {
			dba.set(`${groupId}.${userId}`, {
				status: "dep",
				reason: "",
			});
			r = true;
		}
	}
	return r;
};

/**
 * Carga un archivo JSON a un objeto en tiempo de ejecucion
 * @returns Archivo JSON actualizado
 */
const loadJson = async () => {
	const filePath = path.resolve("./media/temp/praw.json");
	try {
		const data = await fsPromises.readFile(filePath);
		const obj = JSON.parse(data);
		return obj;
	} catch (err) {
		console.log(err);
	}
};

/**
 * Funcion para formatear tiempo de segundos a minutos
 * @param {Number} time Tiempo en segundos
 * @return {String} Tiempo formateado
 * */
const fixTime = async (time) => {
	let hrs = ~~(time / 3600);
	let mins = ~~((time % 3600) / 60);
	let secs = ~~time % 60;
	let result = "";
	if (hrs > 0) {
		result += "" + hrs + ":" + (mins < 10 ? "0" : "");
	}
	result += "" + mins + ":" + (secs < 10 ? "0" : "");
	result += "" + secs;
	return result;
};

/**
 * Resuelve los atributos de un enlace de youtube
 * @param {String} args Enlace de youtube a resolver
 * @returns Atributos del enlace de youtube
 */
const ytSolver = async (args) => {
	let dict = {
		status: 200,
		title: "",
		author: "",
		time: "",
		error: "",
		thumb: "",
	};
	try {
		const info = await ytdl.getInfo(args);
		dict["title"] = info.videoDetails.title;
		dict["author"] = info.videoDetails.author.name;
		dict["time"] = await fixTime(parseInt(info.videoDetails.lengthSeconds));
		let i = 0;
		info.videoDetails.thumbnails.forEach((r) => {
			if (r.height > i) {
				i = r.height;
				dict["thumb"] = r.url;
			} else {
				return;
			}
		});
	} catch (e) {
		dict["status"] = 404;
		dict["error"] = e.toString();
	}
	return dict;
};

/**
 * Crea un sticker a partir de una imagen.
 * @param {TransformStream} image Imagen a convertir a sticker
 * @returns Buffer
 */
const sticker = async (image) => {
	const s = new Sticker(image, {
		pack: "CyopnBot",
		author: "ig: @Cyopn_",
		type: StickerTypes.FULL,
		quality: 1,
	});
	const buffer = await s.toBuffer();
	return buffer;
};

const toArrayBuffer = async (buffer) => {
	const ab = new ArrayBuffer(buffer.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
};

const toPng = async (media) => {
	const form = new FormData();
	const blob = new Blob([await toArrayBuffer(media)]);
	form.append("new-image-url", "");
	form.append("new-image", blob, "image.webp");
	const res = await fetch("https://s6.ezgif.com/webp-to-png", {
		method: "POST",
		body: form,
	});
	const html = await res.text();
	const { document } = new JSDOM(html).window;
	const form2 = new FormData();
	const obj = {};
	for (const input of document.querySelectorAll("form input[name]")) {
		obj[input.name] = input.value;
		form2.append(input.name, input.value);
	}
	const res2 = await fetch("https://ezgif.com/webp-to-png/" + obj.file, {
		method: "POST",
		body: form2,
	});
	const html2 = await res2.text();
	const { document: document2 } = new JSDOM(html2).window;
	return new URL(
		document2.querySelector("div#output > p.outfile > img").src,
		res2.url,
	).toString();
};

const toMp4 = async (media) => {
	const form = new FormData();
	const blob = new Blob([await toArrayBuffer(media)]);
	form.append("new-image-url", "");
	form.append("new-image", blob, "image.webp");
	const res = await fetch("https://s6.ezgif.com/webp-to-mp4", {
		method: "POST",
		body: form,
	});
	const html = await res.text();
	const { document } = new JSDOM(html).window;
	const form2 = new FormData();
	const obj = {};
	for (const input of document.querySelectorAll("form input[name]")) {
		obj[input.name] = input.value;
		form2.append(input.name, input.value);
	}
	const res2 = await fetch("https://ezgif.com/webp-to-mp4/" + obj.file, {
		method: "POST",
		body: form2,
	});
	const html2 = await res2.text();
	const { document: document2 } = new JSDOM(html2).window;
	return new URL(
		document2.querySelector("div#output > p.outfile > video > source").src,
		res2.url,
	).toString();
};

module.exports = {
	getCommands,
	loadDatabase,
	evalLevel,
	getAfk,
	solveAfk,
	loadJson,
	ytSolver,
	sticker,
	toPng,
	toMp4,
};
