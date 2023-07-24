const axios = require("axios");
const fs = require("fs");
//const { createCanvas, loadImage } = require("canvas");
//const imgSize = require('image-size')
//const Jimp = require('jimp')
//const fetch = require("node-fetch")
const fetch = import("node-fetch");
//const data = require("form-data")
const path = require("path");
const fsPromises = require("fs/promises");
const yt = require("yt-converter");
const db = require("megadb");
const afkdB = new db.crearDB({
	nombre: "dataAkf",
	carpeta: "./database",
});
const { prefix } = require("../config.json");
const sleep = require("ko-sleep");
let dBase = new db.crearDB({
	nombre: "dataDesc",
	carpeta: "./database",
});
const lvldB = new db.crearDB({
	nombre: "dataLevel",
	carpeta: "./database",
});

/**
 * Funcion obtener imagen de reddit - obsoleto
 * @param {String} subReddit Reddit a recuperar
 * @return image url
 */
const getRed = async (subReddit) => {
	return await axios.get(`https://meme-api.herokuapp.com/gimme/${subReddit}`);
};

/**
 *
 * Funcion recuperar buffer
 * @param {String} url Pagina recipiente
 * @param {String} options Opciones para recipiente
 * @returns buffer (responsive)
 */
const getBuffer = async (url, options) => {
	try {
		options ? options : {};
		const res = await axios({
			method: "get",
			url,
			headers: {
				DNT: 1,
				"Upgrade-Insecure-Request": 1,
			},
			...options,
			responseType: "arraybuffer",
		});
		return res.data;
	} catch (e) {
		console.error(e);
	}
};

/**
 * Funcion para stickers - Obsoleto
 * @param {Object} client Cliente | Bot
 * @param {String} message Informacion y atributos del mensaje
 */
const createSt = async (client, message) => {
	const { id, from } = message;
	const canvas = createCanvas(500, 500);
	const ctx = canvas.getContext("2d");

	try {
		imgSize("./media/images/imgSt.jpg", function (err, dim) {
			if (err) {
				console.error(err);
			} else {
				let hres = dim.height;
				let wres = dim.width;
				if (hres > wres) {
					let sc = hres / 500;
					wres = wres / sc;
					hres = 500;
					let ps = (500 - wres) / 2;
					Jimp.read("./media/images/imgSt.jpg", (err, imgRes) => {
						if (err) {
							console.error(err);
						} else {
							imgRes
								.resize(wres, hres) // resize
								.quality(60) // set JPEG quality
								.write("./media/images/imgSt.jpg"); // save
						}
					});
					loadImage("https://i.imgur.com/2J1anK8.png").then(
						(image) => {
							ctx.drawImage(image, 0, 0, 500, 500);
							loadImage("./media/images/imgSt.jpg").then((st) => {
								ctx.drawImage(st, ps, 0, wres, hres);
							});
							const out = fs.createWriteStream(
								"./media/images/imgSt.png"
							);
							const stream = canvas.createPNGStream({
								backgroundIndex: 0,
							});
							stream.pipe(out);
							out.on("finish", () => {
								client.sendImageAsSticker(
									from,
									"./media/images/imgSt.png",
									{
										author: "ig: @Cyopn_",
										pack: "CyopnBot",
									}
								);
							});
						}
					);
				} else if (wres > hres) {
					let sca = wres / 500;
					hres = hres / sca;
					wres = 500;
					let pos = (500 - hres) / 2;
					Jimp.read("./media/images/imgSt.jpg", (err, imgRes) => {
						if (err) {
							console.error(err);
						} else {
							imgRes
								.resize(wres, hres) // resize
								.quality(60) // set JPEG quality
								.write("./media/images/imgSt.jpg"); // save
						}
					});
					loadImage("https://i.imgur.com/2J1anK8.png").then(
						(image) => {
							ctx.drawImage(image, 0, 0, 500, 500);
							loadImage("./media/images/imgSt.jpg").then((st) => {
								ctx.drawImage(st, 0, pos, wres, hres);
							});
							const out = fs.createWriteStream(
								"./media/images/imgSt.png"
							);
							const stream = canvas.createPNGStream({
								backgroundIndex: 0,
							});
							stream.pipe(out);
							out.on("finish", () => {
								client.sendImageAsSticker(
									from,
									"./media/images/imgSt.png",
									{
										author: "ig: @Cyopn_",
										pack: "CyopnBot",
									}
								);
							});
						}
					);
				} else if (wres === hres) {
					client.sendImageAsSticker(
						from,
						"./media/images/imgSt.jpg",
						{
							author: "ig: @Cyopn_",
							pack: "CyopnBot",
						}
					);
				}
			}
		});
	} catch (e) {
		console.log(e);
		await client.reply(from, "Ocurio un error", id);
	}
};

/**
 * Funcion subir imagen a telegra.ph
 * @param {Object} buffer (aun no procesado)
 * @return {Object} url (imagen ya posteada)
 * */
const uploadImage = async (buffer) => {
	let form = new data();
	form.append("file", buffer, "tmp.png");
	console.log(form);
	let res = await fetch("https://telegra.ph/upload", {
		method: "POST",
		body: form,
	});

	let img = await res.json();
	if (img.error) throw img.error;
	return "https://telegra.ph" + img[0].src;
};

/**
 * Funcion obtener comandos
 * @param {String} tipo Uso del resultado
 * @return {String} Texto comandos cargados
 * */
const loadCommands = async () => {
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
 * Funcion revisar usuario en afk
 * @param {Object} client Cliente(enviar mensaje)
 * @param {Object} message Mensage(datos del mensaje)
 * */
const getAfk = async (client, message) => {
	const {
		from,
		sender,
		author,
		isGroupMsg,
		chat,
		body,
		quotedMsg,
		mentionedJidList,
		id,
	} = message;
	if (!isGroupMsg) return;
	const groupId = isGroupMsg
		? chat.groupMetadata.id.replace("@g.us", "")
		: "";
	const sid = author.replace("@c.us", "");
	if (
		message.fromMe ||
		message.isMedia ||
		message.type === "image" ||
		message.type === "sticker" ||
		message.type === "ptt"
	)
		return;
	let userCheck;
	userCheck = mentionedJidList[0].replace("@c.us", "");
	if (afkdB.has(groupId) && afkdB.has(`${groupId}.${userCheck}`)) {
		let { status, reason, delay } = await afkdB.get(
			`${groupId}.${userCheck}`
		);
		let res = await fancyTime(delay);
		let re = res.startsWith("0") ? "Segundos" : "Minutos";
		if (status === "afk") {
			await client.reply(
				from,
				`El usuario que estas mecionando no esta disponible ahora \n_Razon: ${reason}_ \n_Tiempo restante: ~${res} ${re}_`,
				id
			);
		}
	}
};

/**
 * Funcion ajustar tiempo
 * @param {Number} time Tiempo en segundos
 * @return {String} Tiempo formateado
 * */
const fancyTime = async (time) => {
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
 *
 * @param {Object} client Cliente/bot
 * @param {Object} event Evento (accion ocurrida en el grupo)
 */
const welcome = async (client, event) => {
	const gChat = await client.getChatById(event.chat);
	const { groupMetadata, name } = gChat;
	const groupId = groupMetadata.id;

	if (!dBase.has(groupId)) {
		dBase.set(groupId, {
			welcome: "No",
			nsfw: "No",
		});
	}
	const res = await dBase.get(groupId);

	try {
		if (res.welcome === "Si" && event.action === "add") {
			const pep = await client.getProfilePicFromServer(event.who);
			const capt = `Hola @${event.who.replace(
				"@c.us",
				""
			)}, Bienvenido a *${name}*, esperamos te diviertas aqui, usa ${prefix}help para ver los comandos`;
			let ps =
				pep && !pep.includes("ERROR")
					? pep
					: "https://telegra.ph/file/24fa902ead26340f3df2c.png";
			await client.sendFileFromUrl(event.chat, ps, "profile.jpg", capt);
		}
	} catch (e) {
		console.error(e);
	}
};

/**
 *
 * @param {Object} client Cliente/bot
 * @param {Object} message Mensaje recibido
 */
const lvlFunc = async (client, message) => {
	const { from, sender, author, isGroupMsg, chat, body } = message;
	if (!isGroupMsg) return;
	const groupId = isGroupMsg
		? chat.groupMetadata.id.replace("@g.us", "")
		: "";
	const sid = author.replace("@c.us", "");
	if (
		message.fromMe ||
		message.isMedia ||
		message.type === "image" ||
		message.type === "sticker" ||
		message.type === "ptt"
	)
		return;

	if (lvldB.has(groupId) && lvldB.has(`${groupId}.${sid}`)) {
		let { xp, level } = await lvldB.get(`${groupId}.${sid}`);
		const sxp = ((Math.random() * body.length) / 10).toFixed(0);
		let lvlup = 5 * level ** 2 + 50 * level + 100;

		if (parseInt(xp) + parseInt(sxp) >= lvlup) {
			await lvldB.set(`${groupId}.${sid}`, {
				xp: parseInt(xp) + parseInt(sxp) - parseInt(lvlup),
				level: parseInt(level) + 1,
			});
			let a = await lvldB.get(`${groupId}.${sid}`);
			await client.sendTextWithMentions(
				from,
				`Felicidades @${sender.id} has avanzado de nivel: ${a.level} \nSigue asi!`
			);
		} else {
			await lvldB.add(`${groupId}.${sid}.xp`, parseInt(sxp) + 1);
		}
	} else {
		await lvldB.set(`${groupId}.${sid}`, {
			xp: 0,
			level: 1,
		});
	}
};

/**
 *
 * @param {String|Array} text Texto con emojis a arreglar
 * @return Texto con emojis formateados
 */
const emojiFix = async (text) => {
	const regex = /\p{Extended_Pictographic}/gu;

	text.forEach((r) => {
		if (regex.test(r)) {
			c += `${encodeURIComponent(r)} `;
		} else {
			c += `${r} `;
		}
	});
	return c;
};

/**
 *
 * @param {String} args Url a descargar
 * @returns Url directo del archivo de audio
 */
const ytSolver = async (args) => {
	let dict = {};
	await yt.getInfo(args).then((info) => {
		dict["title"] = info.title;
		dict["author"] = info.author.name;
		let i = 0;
		info.thumbnails.forEach((r) => {
			if (r.height > i) {
				i = r.height;

				dict["thumb"] = r.url;
			} else {
				return;
			}
		});
	});
	return dict;
};

/**
 *
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

module.exports = {
	getBuffer,
	createSt,
	getRed,
	uploadImage,
	loadCommands,
	getAfk,
	fancyTime,
	welcome,
	lvlFunc,
	emojiFix,
	ytSolver,
	loadJson,
};
