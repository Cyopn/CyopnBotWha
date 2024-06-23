const sleep = require("ko-sleep");
const ytdl = require("ytdl-core");
const fs = require("fs");
const axios = require("axios").default;	


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
const ytSimpleSolver = async (args) => {
	let dict = {
		status: 200,
		title: "",
		author: "",
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

const getCommands = async () => {
	let command = [];
	let alias = [];
	let type = [];
	let desc = [];
	let fulldesc = [];
	fs.readdir("./tests/commands/", (err, files) => {
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
 * Obtiene el archivo de instagram
 * @param {String} url URL de instagram
 * @returns Archivo
 */
const getIgFile= async (url) => {
	const result = await axios.get(
		`https://aemt.me/download/igdl?url=${encodeURI(url)}`,
	);
	return result;
};

module.exports = { ytSimpleSolver, fixTime, getCommands, getIgFile };
