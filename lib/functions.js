const fs = require("fs");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const path = require("path");
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
const { execSync, spawnSync } = require("child_process");
const os = require("os");
const crypto = require("crypto");
let sharp;
try {
	sharp = require("sharp");
} catch (e) {
	sharp = null;
}

/**
 * Función asíncrona para obtener los comandos existentes en el directorio ./commands.
 * @returns Diccionario con todos los comandos con su respectivo alias, tipo, descripción y descripción detallada.
 */
const getCommands = async () => {
	const command = [];
	const alias = [];
	const type = [];
	const desc = [];
	const expects = [];
	const returns = [];

	const files = fs.readdirSync(path.resolve("./commands"));
	const jsfile = files
		.filter((f) => f.split(".").pop() === "js")
		.sort((a, b) => a.localeCompare(b));

	if (jsfile.length <= 0) {
		console.log("No se encontró ningún comando");
		return { command, alias, type, desc };
	}

	jsfile.forEach((f) => {
		const pull = require(`../commands/${f}`);
		if (!pull?.config?.name) return;
		command.push(pull.config.name);
		alias.push(Array.isArray(pull.config.alias) ? pull.config.alias : []);
		type.push(pull.config.type || "misc");
		desc.push(pull.config.description || "Sin descripcion.");
		expects.push(Array.isArray(pull.config.expects) ? pull.config.expects : []);
		returns.push(Array.isArray(pull.config.returns) ? pull.config.returns : []);
	});

	return { command, alias, type, desc, expects, returns };
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
/* const ytSolver = async (args) => {
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
}; */

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

const normalizeStickerImage = async (buffer) => {
	if (!sharp) return buffer;
	const pipeline = sharp(buffer, { animated: false }).rotate();
	const metadata = await pipeline.metadata();
	const needsResize = (metadata.width && metadata.width > 512) || (metadata.height && metadata.height > 512);
	const output = needsResize
		? pipeline.resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
		: pipeline;
	return await output.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
};

const normalizeStickerVideo = async (buffer) => {
	const suffix = crypto.randomBytes(4).toString("hex");
	const inputPath = path.join(os.tmpdir(), `cyopn-sticker-in-${Date.now()}-${suffix}.mp4`);
	const outputPath = path.join(os.tmpdir(), `cyopn-sticker-out-${Date.now()}-${suffix}.mp4`);
	try {
		fs.writeFileSync(inputPath, buffer);
		const ffmpegArgs = [
			"-y",
			"-i", inputPath,
			"-an",
			"-t", "6",
			"-vf", "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=15",
			"-r", "15",
			"-c:v", "libx264",
			"-preset", "veryfast",
			"-crf", "30",
			"-pix_fmt", "yuv420p",
			"-movflags", "+faststart",
			outputPath,
		];
		const result = spawnSync("ffmpeg", ffmpegArgs, { stdio: "pipe" });
		if (result.status !== 0 || !fs.existsSync(outputPath)) {
			return buffer;
		}
		return fs.readFileSync(outputPath);
	}catch(e){
		console.error("Error al normalizar video para sticker:", e);
		return buffer;
	} finally {
		if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
		if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
	}
};

const prepareStickerMedia = async (buffer, kind) => {
	if (kind === "video" || kind === "gif") {
		return await normalizeStickerVideo(buffer);
	}
	if (kind === "image") {
		return await normalizeStickerImage(buffer);
	}
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
};

const errorHandler = async (sock, msg, command, err) => {
	try {
		console.error(err.toString());
		console.log(`${command}.${new Date().toLocaleDateString().replaceAll("/", "-")}T${new Date().toLocaleTimeString().replaceAll(":", "-").replaceAll(".", "-")}`);

	} catch (e) {
		console.error(`try-catch ${e}`);
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
			text: "Ocurrió un error inesperado.",
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
		if (m === undefined || m === null || type === undefined || type === null) return;
		const w = await downloadContentFromMessage(m, type);
		w.pipe(fs.createWriteStream(`./media_storage/${remoteJid}D${new Date().toLocaleDateString().replaceAll("/", "-")}T${new Date().toLocaleTimeString().replaceAll(":", "-")}.${type === "image" ? "jpg" : "mp4"}`));
	} catch (e) {
	}
};

const copyDir = (src, dest) => {
	fs.mkdirSync(dest, { recursive: true });

	for (const item of fs.readdirSync(src, { withFileTypes: true })) {
		const from = path.join(src, item.name);
		const to = path.join(dest, item.name);

		if (item.isDirectory()) copyDir(from, to);
		else fs.copyFileSync(from, to);
	}
}

const replaceBase64Image = (jsonPath, dataUri) => {
	const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

	if (!Array.isArray(json.assets)) {
		throw new Error("JSON sem assets.");
	}

	const asset = json.assets.find(a => typeof a?.p === "string" && a.p.startsWith("data:image/"));
	if (!asset) {
		throw new Error("Nenhuma imagem base64 encontrada no Lottie.");
	}

	asset.p = dataUri;
	fs.writeFileSync(jsonPath, JSON.stringify(json));
}

const zipToWas = (folder, output) => {
	fs.mkdirSync(path.dirname(output), { recursive: true });
	const zipPath = output.replace(/\.was$/i, ".zip");
	if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
	if (fs.existsSync(output)) fs.unlinkSync(output);
	execSync(`zip -r "${zipPath}" .`, { cwd: folder, stdio: "ignore" });
	fs.renameSync(zipPath, output);
}

const buildLottieSticker = async (buffer) => {
	const baseFolder = path.resolve("./lib/base");
	const wasPath = path.resolve("./temp/jurubeba.was");
	const jsonPath = "animation/animation_secondary.json";
	const tempDir = path.join(os.tmpdir(), `lottie-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`);
	try {
		copyDir(baseFolder, tempDir);
		replaceBase64Image(path.join(tempDir, jsonPath), `data:image/png;base64,${buffer.toString("base64")}`);
		zipToWas(tempDir, wasPath);
	} catch (e) {
		throw new Error("Error al construir el sticker Lottie: " + e.toString());
	}
	return wasPath;
}

module.exports = {
	getCommands,
	loadJson,
	sticker,
	prepareStickerMedia,
	toPng,
	toMp4,
	tgsConverter,
	getLyrics,
	errorHandler,
	msgStorage,
	buildLottieSticker
};
