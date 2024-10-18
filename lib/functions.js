const fs = require("fs");
const sleep = require("ko-sleep");
const db = require("megadb");
const ytdl = require("ytdl-core");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
require("dotenv").config();
const { prefix, owner } = process.env;
let FormData;
let Blob;
import("formdata-node").then((r) => {
	FormData = r.FormData;
	Blob = r.Blob;
});
const { JSDOM } = require("jsdom");
var __importDefault = (this && this.__importDefault) || function (mod) {
	return (mod && mod.__esModule) ? mod : { "default": mod };
};
const got = __importDefault(require("got-cjs"));
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const CryptoJS = require('crypto-js')

/* let dbs = new db.crearDB({
	nombre: "dataDesc",
	carpeta: "./database",
});*/
let dbl = new db.crearDB({
	nombre: "level",
	carpeta: "./database",
});
let dba = new db.crearDB({
	nombre: "afk",
	carpeta: "./database",
});

let dbs = new db.crearDB({
	nombre: "storage",
	carpeta: "./database",
})

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
/* const loadDatabase = async (client) => {
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
}; */

/**
 * Sistema de niveles
 * @param {Object} client Cliente/bot
 * @param {Object} message Mensaje recibido
 */
const evalLevel = async (sock, msg, content) => {
	const { remoteJid, participant } = msg.key;
	const gid = remoteJid.split("@")[0];
	const uid =
		participant !== undefined
			? participant.split("@")[0]
			: remoteJid.split("@")[0];
	const sxp =
		parseInt(((Math.random() * content.length) / 10).toFixed(0)) + 1;
	const r = await dbl.get(gid);
	if (dbl.has(gid) && dbl.has(`${gid}.${uid}`)) {
		let { xp, level } = await dbl.get(`${gid}.${uid}`);
		let lvlup = 5 * level ** 2 + 50 * level + 100;
		if (parseInt(xp) + parseInt(sxp) >= lvlup) {
			await dbl.set(`${gid}.${uid}`, {
				xp: 0,
				level: parseInt(level + 1),
			});
			let a = await dbl.get(`${gid}.${uid}`);
			await sock.sendMessage(msg.key.remoteJid, {
				text: `Felicidades @${uid} has avanzado de nivel: ${a.level} \n¡Sigue asi!\nUsa _${prefix}rank_ para ver la tabla de clasificacion.`,
				mentions: [`${uid}@s.whatsapp.net`],
			});
		} else {
			await dbl.add(`${gid}.${uid}.xp`, parseInt(sxp));
		}
	} else {
		await dbl.set(`${gid}.${uid}`, {
			xp: parseInt(sxp),
			level: 1,
		});
	}
};

/**
 * Obtiene el estado de un mienbro si esta en afk
 * @param {String} gid Identificador del grupo
 * @param {String} uid Identificador del usuario
 * @returns Indefinido si no esta en afk, la razon si no es asi
 */
const getAfk = async (gid, uid) => {
	let r = undefined;
	if (dba.has(`${gid}.${uid}`)) {
		const { status, reason } = await dba.get(`${gid}.${uid}`);
		if (status === "afk") {
			r = reason;
		}
	}
	return r;
};

/**
 * Resuelva el estado de un miembro si esta en afk
 * @param {String} gid Identificador del grupo
 * @param {String} uid identificador del usuario
 * @returns Verdadero si se ha desactivado el afk, de lo contrario sea falso
 */
const solveAfk = async (gid, uid, sts) => {
	let r = false;
	if (dba.has(`${gid}.${uid}`)) {
		const { status } = await dba.get(`${gid}.${uid}`);
		if (status === "afk") {
			dba.set(`${gid}.${uid}`, {
				status: sts,
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
 * Formatear tiempo de segundos a minutos
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
		dict["title"] = info.videoDetails.title
			.toString()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "");
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
		quality: 10,
	});
	const buffer = await s.toBuffer();
	return buffer;
};

/**
 * Convierte Buffer a ArrayBuffer
 * @param {Buffer} buffer Buffer a convertir
 * @returns ArrayBuffer
 */
const toArrayBuffer = async (buffer) => {
	const ab = new ArrayBuffer(buffer.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
};

/**
 * Convierte webp a pgn
 * @param {TransformStream} media Media a convertir
 * @returns URL
 */
const toPng = async (media) => {
	const form = new FormData();
	const blob = new Blob([await toArrayBuffer(media)]);
	form.append("new-image-url", "");
	form.append("new-image", blob, "image.webp");
	const res = await fetch("https://ezgif.com/webp-to-png", {
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

/**
 * Convierte webp a mp4
 * @param {TransformStream} media Media a convertir
 * @returns URL
 */
const toMp4 = async (media) => {
	const form = new FormData();
	const blob = new Blob([await toArrayBuffer(media)]);
	form.append("new-image-url", "");
	form.append("new-image", blob, "image.webp");
	const res = await fetch("https://ezgif.com/webp-to-mp4", {
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

/**
 * Convierte tgs (pegatina de telegram) a gif
 * @param {TransformStream} media Media a convertir
 * @returns URL
 */
const tgsConverter = async (media) => {
	const form = new FormData();
	const blob = new Blob([await toArrayBuffer(media)]);
	form.append("new-image-url", "");
	form.append("new-image", blob, "image.tgs");
	const res = await fetch("https://ezgif.com/tgs-to-gif", {
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
	const res2 = await fetch("https://ezgif.com/tgs-to-gif/" + obj.file, {
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

/**
 * 
 * @param {String} query busqueda de la letra de la cancion
 * @returns resultado de la busqueda
 */
const getLyrics = async (query) => {
	const data = await (0, got.default)(`https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(query)}`, {
		headers: {
			accept: 'application/json, text/plain, */*',
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
		}
	}).json();

	const result = (_b = (_a = data.response.sections.find((section) => {
		var _a;
		return ['song', 'lyric'].includes(section.type) &&
			((_a = section.hits) === null || _a === void 0 ? void 0 : _a.find((hit) => ['song', 'lyric'].includes(hit.type)));
	}).hits) === null || _a === void 0 ? void 0 : _a.find((hit) => ['song', 'lyric'].includes(hit.type))) === null || _b === void 0 ? void 0 : _b.result;
	if (!result)
		throw new Error(`Can't get json!\n${JSON.stringify(data)}`);
	const { artist_names, title, url } = result;
	if (!url)
		throw new Error(`Can't get lyrics!\n${JSON.stringify(data, null, 2)}`);
	const html = await (0, got.default)(url).text();
	const { document } = new JSDOM(html).window;
	const results = document.querySelector('div#lyrics-root > div[data-lyrics-container="true"]').innerHTML.replace(/<\/?[^>]+(>|$)/g, '\n').split('\n').filter((line) => line.trim()).join('\n');
	const res = {
		title,
		author: artist_names,
		lyrics: results,
		link: url
	};
	return res;
}

const errorHandler = async (sock, msg, command, err) => {
	try {
		console.error(err.toString());
	} catch (e) {
		console.error(`try-catch ${err}`);
	}
	const sub = msg.key.remoteJid.includes("g.us")
		? await sock.groupMetadata(msg.key.remoteJid)
		: {
			subject: msg.key.remoteJid.replace("@s.whatsapp.net", ""),
		};
	await sock.sendMessage(`${owner}@s.whatsapp.net`, {
		text: `Error en ${command} - ${sub.subject}\n${String(err)}`,
	});
	await sock.sendMessage(
		msg.key.remoteJid,
		{
			text: "Ocurrio un error inesperado.",
		},
		{ quoted: msg },
	);
};

const msgStorage = async (msg) => {
	try {
		const remoteJid = msg.key.remoteJid.split("@")[0];
		const type =
			msg.message.imageMessage ||
				msg.message?.viewOnceMessage?.message?.imageMessage ||
				msg.message?.viewOnceMessageV2?.message?.imageMessage
				? "image"
				: msg.message?.videoMessage ||
					msg.message?.viewOnceMessage?.message?.videoMessage ||
					msg.message?.viewOnceMessageV2?.message?.videoMessage
					? "video"
					: undefined;

		const m = msg.message?.imageMessage
			? msg.message?.imageMessage
			: msg.message?.videoMessage
				? msg.message?.videoMessage
				: msg.message?.viewOnceMessage?.message?.imageMessage
					? msg.message?.viewOnceMessage?.message?.imageMessage
					: msg.message?.viewOnceMessage?.message?.videoMessage
						? msg.message?.viewOnceMessage?.message?.videoMessage
						: msg.message?.viewOnceMessageV2?.message?.imageMessage
							? msg.message?.viewOnceMessageV2?.message?.imageMessage
							: msg.message?.viewOnceMessageV2?.message?.videoMessage
								? msg.message?.viewOnceMessageV2?.message?.videoMessage
								: undefined;
		if (m === undefined || m === null || type === undefined || type === null) return
		const w = await downloadContentFromMessage(m, type);
		w.pipe(fs.createWriteStream(`./media_storage/${remoteJid}D${new Date().toLocaleDateString().replaceAll("/", "-")}T${new Date().toLocaleTimeString().replaceAll(":", "-")}.${type === "image" ? "jpg" : "mp4"}`));
	} catch (e) {
	}
}

/**
 * 
 * @param {String} input url a encriptar
 * @returns url encriptada
 */
function encryptUrl(input) {
	const key = CryptoJS.enc.Utf8.parse('qwertyuioplkjhgf')
	const iv = CryptoJS.lib.WordArray.random(16)

	const encrypted = CryptoJS.AES.encrypt(input, key, {
		iv: iv,
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7,
	});

	const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
	return encryptedHex
}

module.exports = {
	getCommands,
	/*loadDatabase,*/
	evalLevel,
	getAfk,
	solveAfk,
	loadJson,
	ytSolver,
	sticker,
	toPng,
	toMp4,
	tgsConverter,
	getLyrics,
	errorHandler,
	msgStorage
};
