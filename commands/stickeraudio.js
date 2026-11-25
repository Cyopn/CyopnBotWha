require("dotenv").config();
const { prefix } = process.env;
const {
	errorHandler,
	createAnimatedSticker,
	sendSoundSticker,
	cleanupSoundStickerTemp,
} = require("../lib/functions");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fsPromises = require("node:fs/promises");
const path = require("node:path");
const { promisify } = require("node:util");
const { execFile } = require("node:child_process");
const ffmpeg = require("ffmpeg-static");

const execFileAsync = promisify(execFile);
const MAX_SOUND_DURATION = 10;

const inspectAudio = async (audioPath) => {
	const audioBuffer = await fsPromises.readFile(audioPath);
	if (
		audioBuffer.length < 4 ||
		audioBuffer.toString("ascii", 0, 4) !== "OggS"
	) {
		throw new Error("FFmpeg no generó un contenedor OGG válido.");
	}

	const { stderr } = await execFileAsync(
		ffmpeg,
		["-hide_banner", "-i", audioPath, "-map", "0:a:0", "-f", "null", "-"],
		{ maxBuffer: 8 * 1024 * 1024 },
	);
	const durationMatch = stderr.match(
		/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/,
	);
	if (!durationMatch || !/Audio:\s*opus,\s*48000 Hz,\s*mono/i.test(stderr)) {
		throw new Error("El audio convertido no es Opus mono válido.");
	}

	const duration =
		Number(durationMatch[1]) * 3600 +
		Number(durationMatch[2]) * 60 +
		Number(durationMatch[3]);
	if (
		!Number.isFinite(duration) ||
		duration <= 0 ||
		duration > MAX_SOUND_DURATION + 0.1
	) {
		throw new Error("La duración del audio convertido no es compatible.");
	}
	return { audioBuffer, duration };
};

const convertToOggOpus = async (videoPath, tempDir, duration, useMp3) => {
	const audioPath = path.join(tempDir, "sound.ogg");
	const commonArgs = [
		"-y",
		"-v",
		"error",
		"-i",
		videoPath,
		"-map",
		"0:a:0",
		"-t",
		duration.toFixed(3),
		"-vn",
		"-ac",
		"1",
		"-ar",
		"48000",
	];
	if (!useMp3) {
		await execFileAsync(
			ffmpeg,
			[
				...commonArgs,
				"-c:a",
				"libopus",
				"-b:a",
				"48k",
				"-f",
				"ogg",
				audioPath,
			],
			{ maxBuffer: 8 * 1024 * 1024 },
		);
		return inspectAudio(audioPath);
	}

	const mp3Path = path.join(tempDir, "intermediate.mp3");
	await execFileAsync(
		ffmpeg,
		[
			...commonArgs,
			"-c:a",
			"libmp3lame",
			"-b:a",
			"96k",
			"-f",
			"mp3",
			mp3Path,
		],
		{ maxBuffer: 8 * 1024 * 1024 },
	);
	await execFileAsync(
		ffmpeg,
		[
			"-y",
			"-v",
			"error",
			"-i",
			mp3Path,
			"-map",
			"0:a:0",
			"-t",
			duration.toFixed(3),
			"-ac",
			"1",
			"-ar",
			"48000",
			"-c:a",
			"libopus",
			"-b:a",
			"48k",
			"-f",
			"ogg",
			audioPath,
		],
		{ maxBuffer: 8 * 1024 * 1024 },
	);
	return inspectAudio(audioPath);
};

const findMedia = (message) => {
	let current = message;
	for (let depth = 0; current && depth < 8; depth++) {
		if (current.videoMessage) {
			return { media: current.videoMessage, type: "video" };
		}
		if (current.imageMessage) {
			return { media: current.imageMessage, type: "image" };
		}
		current =
			current.ephemeralMessage?.message ||
			current.viewOnceMessage?.message ||
			current.viewOnceMessageV2?.message ||
			current.viewOnceMessageV2Extension?.message;
	}
	return undefined;
};

module.exports.run = async function (sock, msg, args) {
	const commandArgs = Array.isArray(args?.[0])
		? args[0].map((argument) => String(argument).toLowerCase())
		: typeof args?.[0] === "string"
			? args[0].toLowerCase().split(/\s+/).filter(Boolean)
			: [];
	const useMp3Pipeline = commandArgs.includes("mp3");
	const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
	const candidates = [findMedia(msg.message), findMedia(quoted)].filter(Boolean);
	const source = candidates.find((candidate) => candidate.type === "video")
		|| candidates[0];

	if (!source) {
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Envía o responde a un vídeo con audio usando *${prefix}stickeraudio*. Añade *mp3* si el sonido no se logra reproducir.`,
			},
			{ quoted: msg },
		);
	}
	if (source.type !== "video") {
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "Para crear un sticker con audio, el vídeo debe incluir una pista de audio.",
			},
			{ quoted: msg },
		);
	}

	try {
		const mediaStream = await downloadContentFromMessage(source.media, "video");
		const chunks = [];
		for await (const chunk of mediaStream) {
			chunks.push(Buffer.from(chunk));
		}
		if (chunks.length === 0) {
			throw new Error("WhatsApp no devolvió datos del vídeo.");
		}
		const videoBuffer = Buffer.concat(chunks);
		const stickerBuffer = await createAnimatedSticker(videoBuffer);
		if (!stickerBuffer) {
			return sock.sendMessage(
				msg.key.remoteJid,
				{
					text: "No se pudo convertir el vídeo en un sticker compatible.",
				},
				{ quoted: msg },
			);
		}

		const declaredDuration = Number(source.media.seconds);
		const duration = Math.max(
			0.2,
			Math.min(
				MAX_SOUND_DURATION,
				Number.isFinite(declaredDuration) && declaredDuration > 0
					? declaredDuration
					: MAX_SOUND_DURATION,
			),
		);
		const tempRoot = path.resolve("./temp");
		await fsPromises.mkdir(tempRoot, { recursive: true });
		const tempDir = await fsPromises.mkdtemp(
			path.join(tempRoot, "sound-sticker-"),
		);
		try {
			const videoPath = path.join(tempDir, "source.mp4");
			await fsPromises.writeFile(videoPath, videoBuffer);
			try {
				const result = await convertToOggOpus(
					videoPath,
					tempDir,
					duration,
					useMp3Pipeline,
				);
				await sendSoundSticker(
					sock,
					msg.key.remoteJid,
					stickerBuffer,
					result.audioBuffer,
					result.duration,
				);
			} catch (error) {
				const details = `${error?.stderr || ""}\n${error?.message || ""}`;
				if (/matches no streams|does not contain any stream/i.test(details)) {
					return sock.sendMessage(
						msg.key.remoteJid,
						{
							text: "El vídeo no contiene una pista de audio para el sticker.",
						},
						{ quoted: msg },
					);
				}
				throw error;
			}
		} finally {
			await cleanupSoundStickerTemp(tempDir);
		}
	} catch (error) {
		await errorHandler(sock, msg, module.exports.config.name, error);
	}
};

module.exports.config = {
	name: "stickeraudio",
	alias: ["sa"],
	type: "misc",
	description: "Crea un sticker con audio, añade mp3 si el sonido no se logra reproducir.",
};
