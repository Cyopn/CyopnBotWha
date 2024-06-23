const ytdl = require("ytdl-core");
import { Video } from "yt-converter";

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

const downloadVideo = async (link) => {
	let result = "";
	const { status, title, author, error, time, thumb } = await ytSolver(link);
	if (status === 200) {
		let ttl = "";
		for (let i = 0; i < title.length; i++) {
			ttl += title[i].match(/([A-Za-z])/g)
				? title[i]
				: title[i] === " "
				? " "
				: "";
		}
		try {
			const data = await Video({
				url: link,
				directory: "./temp",
			});
			result = "Video descargado correctamente";
		} catch (e) {
			result += "Error al descargar el video" + e.toString();
		}
	}
	return result;
};

export default downloadVideo;
