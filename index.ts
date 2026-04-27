import { Boom } from "@hapi/boom";
import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import fs from "fs/promises";
const fsSync = require('fs');
import NodeCache from '@cacheable/node-cache'
import P from 'pino'
import sleep from 'ko-sleep'

const { msgStorage, getCommands } = require("./lib/functions.js");
const { processGroup, evalLevel, saveConversation, getConfig, getConfigValue, setConfigValue } = require("./lib/db.js");
const { chatWithOllama, isMessageAboutBot } = require("./lib/ollama.js");
require("dotenv").config();
const { prefix, owner, channel, port, bot, BOT_MENU_IDENTIFIERS } = process.env;
const express = require("express");
const bodyParser = require("body-parser");
const msgRetryCounterCache = new NodeCache<any>()
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./logs.txt'))
logger.level = 'silent'

let commands: Map<string, { name: string, alias: string[] }> = new Map()
const MENU_WORDS_REGEX = /\b(menu|comando|comandos)\b/i;
const GREETING_WORDS_REGEX = /^(hola|holaa+|buenas|buenos dias|buenos días|buenas tardes|buenas noches|que tal|qué tal|saludos)\b/i;
const URL_WORDS_REGEX = /(https?:\/\/|www\.|t\.me\/|wa\.me\/)/i;
const botMenuIdentifiers = (BOT_MENU_IDENTIFIERS || "bot,chip,cyopnbot,cyopn")
	.split(",")
	.map((x) => x.trim().toLowerCase())
	.filter(Boolean);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasMenuWord = (text: string) => MENU_WORDS_REGEX.test(String(text || ""));
const isGreetingMessage = (text: string) => GREETING_WORDS_REGEX.test(String(text || "").trim().toLowerCase());
const hasUrl = (text: string) => URL_WORDS_REGEX.test(String(text || ""));
const getGreetingByTime = () => {
	const hour = new Date().getHours();
	if (hour >= 6 && hour < 12) return "Buenos días";
	if (hour >= 12 && hour < 20) return "Buenas tardes";
	return "Buenas noches";
};
const buildGreetingReply = () => `${getGreetingByTime()}, ¿en qué te puedo ayudar? Puedes pedirme el menu o hacerme una pregunta.`;
const MEDIA_COMMANDS_BY_KIND: Record<string, string[]> = {
	sticker: ["toimg", "tovideo", "sticker"],
	image: ["sticker", "lottie", "attp"],
	video: ["toaudio", "sticker", "tovideo"],
	link: ["fbdownload", "igdownload", "tiktok", "tkaudio", "tuiter"],
};
const MEDIA_INTRO_BY_KIND: Record<string, string> = {
	sticker: "Recibi un sticker. Estos comandos te sirven especificamente para stickers:",
	image: "Recibi una imagen. Estos comandos te sirven especificamente para imagenes:",
	video: "Recibi un video. Estos comandos te sirven especificamente para videos:",
	link: "Recibi un enlace. Estos comandos te sirven especificamente para enlaces:",
};
const buildPersonalMediaReply = async (kind: string) => {
	const allowedCommands = Object.entries(COMMAND_INPUT_MAP)
		.filter(([, kinds]) => Array.isArray(kinds) && kinds.includes(kind))
		.map(([name]) => name);

	if (allowedCommands.length === 0) {
		return `Puedo orientarte con comandos segun el tipo de mensaje. Escribe ${prefix}help para ver la lista completa.`;
	}

	const { command, alias, desc } = await getCommands();
	const commandMap = new Map<string, { alias: string[]; desc: string }>();
	command.forEach((name, index) => {
		commandMap.set(name, {
			alias: Array.isArray(alias[index]) ? alias[index] : [],
			desc: desc[index] || "Sin descripcion.",
		});
	});

	let txt = `${MEDIA_INTRO_BY_KIND[kind] || "Estos comandos te pueden ayudar:"}`;
	let found = 0;
	allowedCommands.forEach((name) => {
		const row = commandMap.get(name);
		if (!row) return;
		found += 1;
		const aliasText = row.alias.length > 0 ? row.alias.join(", ") : "-";
		txt += `\n\n*${name}* (alias: ${aliasText})\n_${row.desc}_`;
	});

	if (found === 0) {
		return `Puedo ayudarte con este tipo de mensaje, pero no encontre comandos configurados para mostrar. Usa ${prefix}help para ver el menu completo.`;
	}

	return txt;
};
const stripBotMentionsAndIdentifiers = (text: string) => {
	let normalized = String(text || "").toLowerCase();
	normalized = normalized.replace(/@[\w.-]+/g, " ");
	for (const identifier of botMenuIdentifiers) {
		const pattern = new RegExp(`\\b${escapeRegExp(identifier)}\\b`, "gi");
		normalized = normalized.replace(pattern, " ");
	}
	return normalized.replace(/\s+/g, " ").trim();
};
const hasBotIdentifierInText = (text: string) => {
	const normalized = String(text || "").toLowerCase();
	if (!normalized.length || botMenuIdentifiers.length === 0) return false;
	return botMenuIdentifiers.some((identifier) => {
		const pattern = new RegExp(`\\b${escapeRegExp(identifier)}\\b`, "i");
		return pattern.test(normalized);
	});
};

const app = express();
app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	}),
);
app.get("/", (request, response) => {
	response.json({ info: "En linea" });
});
app.listen(port, () => {
	console.log(`Aplicacion corriendo en el puerto ${port}.`);
});
fs.readdir(`./commands/`).then((files) => {
	let jsfile = files.filter((f) => f.split(".").pop() === "js");
	if (jsfile.length <= 0) return console.log("No se encontró ningún comando");
	jsfile.forEach((f) => {
		let pull = require(`./commands/${f}`);
		commands.set((f.split(".")[0]), { "name": pull.config.name, "alias": pull.config.alias })
	});
})

const buildCommandsMenu = async () => {
	const { command, alias, type, desc } = await getCommands();
	let txt = `*CyopnBot* 
	*Prefijo*: [  ${prefix}  ] 
	_yo_ : https://instagram.com/Cyopn_
	Sigue el canal de información para estar al día de las novedades y actualizaciones: ${channel}

	*Información*
	Escribe ${prefix} seguido de cualquiera de los comandos. Puedes usar el nombre del comando o su alias.
	_Uso: ${prefix}[Comando] [Texto/Enlace/Otros]_
	Se deben sustituir los paréntesis/corchetes según corresponda.
	_Ejemplo: ${prefix}attp Hola_

	*Comandos disponibles*:`;
	command.forEach((name) => {
		const sr = command.indexOf(name);
		if (type[sr] === "ign" || type[sr] === "admin") return;
		txt += `\n*${name}* (alias: ${alias[sr].toString().replaceAll(",", ", ")})\n_${desc[sr]}_\n`;
	});
	return txt;
};

const analyzeCommandsInput = () => {
	const commandFiles = fsSync.readdirSync(require('path').resolve('./commands'))
		.filter((f: string) => f.endsWith('.js'));
	const map: Record<string, string[]> = {};
	for (const f of commandFiles) {
		try {
			const modulePath = require('path').resolve('./commands', f);
			const mod = require(modulePath);
			const cmdName = (mod?.config?.name) ? mod.config.name : f.replace(/\.js$/, '');
			if (Array.isArray(mod?.config?.expects) && mod.config.expects.length > 0) {
				map[cmdName] = mod.config.expects.map((k: string) => String(k).toLowerCase());
				continue;
			}
			const content = fsSync.readFileSync(modulePath, 'utf8');
			const kinds: Set<string> = new Set();
			if (/stickerMessage|downloadContentFromMessage\([^,]+,\s*"sticker"|\bsticker\b/.test(content)) kinds.add('sticker');
			if (/imageMessage|downloadContentFromMessage\([^,]+,\s*"image"|\bimage:\b/.test(content)) kinds.add('image');
			if (/videoMessage|downloadContentFromMessage\([^,]+,\s*"video"|py_cmd_vid|\bvideo:\b/.test(content)) kinds.add('video');
			if (/fbdownload|igdownload|tiktok|tuiter|twitter|https?:\/\//.test(content)) kinds.add('link');
			if (/extendedTextMessage\?\.contextInfo\?\.quotedMessage\?\.stickerMessage/.test(content)) kinds.add('sticker');
			if (/extendedTextMessage\?\.contextInfo\?\.quotedMessage\?\.imageMessage/.test(content)) kinds.add('image');
			if (/extendedTextMessage\?\.contextInfo\?\.quotedMessage\?\.videoMessage/.test(content)) kinds.add('video');
			map[cmdName] = Array.from(kinds);
		} catch (e) {
		}
	}
	return map;
};

const COMMAND_INPUT_MAP = analyzeCommandsInput();

const getIncomingMessageKind = (msg: any, text: string) => {
	const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
	const quotedViewOnceMessage = msg.message?.viewOnceMessage?.message;
	const quotedViewOnceMessageV2 = msg.message?.viewOnceMessageV2?.message;
	const quotedNestedViewOnceMessage = quotedMessage?.viewOnceMessage?.message;
	const quotedNestedViewOnceMessageV2 = quotedMessage?.viewOnceMessageV2?.message;
	if (
		msg.message?.stickerMessage ||
		quotedMessage?.stickerMessage ||
		quotedViewOnceMessage?.stickerMessage ||
		quotedViewOnceMessageV2?.stickerMessage ||
		quotedNestedViewOnceMessage?.stickerMessage ||
		quotedNestedViewOnceMessageV2?.stickerMessage
	) {
		return "sticker";
	}
	if (
		msg.message?.imageMessage ||
		quotedMessage?.imageMessage ||
		quotedViewOnceMessage?.imageMessage ||
		quotedViewOnceMessageV2?.imageMessage ||
		quotedNestedViewOnceMessage?.imageMessage ||
		quotedNestedViewOnceMessageV2?.imageMessage
	) {
		return "image";
	}
	if (
		msg.message?.videoMessage ||
		quotedMessage?.videoMessage ||
		quotedViewOnceMessage?.videoMessage ||
		quotedViewOnceMessageV2?.videoMessage ||
		quotedNestedViewOnceMessage?.videoMessage ||
		quotedNestedViewOnceMessageV2?.videoMessage
	) {
		return "video";
	}
	if (hasUrl(text)) return "link";
	return "text";
};

const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState('auth_info')
	const { version } = await fetchLatestBaileysVersion()

	const sock = makeWASocket({
		version,
		logger,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		msgRetryCounterCache,
	});

	if (!sock.authState.creds.registered) {
		await sleep(1000)
		const code = await sock.requestPairingCode(bot)
		console.log(`Codigo de verificacion: ${code}`)
	}

	console.log("Cliente listo");
	sock.ev.process(async (events) => {
		if (events['connection.update']) {
			const update = events['connection.update']
			const { connection, lastDisconnect } = update
			if (connection === 'close') {
				if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
					startSock()
				} else {
					console.log('Conexion cerrada, sin sesion.')
				}
			}
		}

		if (events["creds.update"]) {
			await saveCreds();
		}

		if (events["groups.upsert"]) {
			const [metadata] = events["groups.upsert"];
			await sock.sendMessage(metadata.id, {
				text: `Gracias por invitarme.\nUsa !help para ver los comandos disponibles.\nCualquier duda o sugerencia será respondida en:\nWhatsApp: wa.me/+5215633592644\nInstagram: https://www.instagram.com/cyopn_/\n*Nota importante*: El administrador del bot/número tendrá acceso a este chat.\nSigue el canal de información para estar al día de novedades y actualizaciones: ${channel}`,
			});
		}

		if (events["messages.upsert"]) {
			const upsert = events["messages.upsert"];
			if (upsert.type === "append" || upsert.type === "notify") {
				for (const msg of upsert.messages) {
					await processGroup(msg);
					if (!msg.key.fromMe) {
						await msgStorage(msg);
						const message = msg.message?.viewOnceMessage?.message
							?.imageMessage?.caption
							? msg.message?.viewOnceMessage?.message
								?.imageMessage?.caption
							: msg.message?.viewOnceMessage?.message
								?.videoMessage?.caption
								? msg.message?.viewOnceMessage?.message
									?.videoMessage?.caption
								: msg.message?.viewOnceMessageV2?.message
									?.imageMessage?.caption
									? msg.message?.viewOnceMessageV2?.message
										?.imageMessage?.caption
									: msg.message?.viewOnceMessageV2?.message
										?.videoMessage?.caption
										? msg.message?.viewOnceMessageV2?.message
											?.videoMessage?.caption
										: msg.message?.extendedTextMessage?.text
											? msg.message?.extendedTextMessage?.text.trim()
											: msg.message?.conversation
												? msg.message?.conversation
												: msg.message?.imageMessage?.caption
													? msg.message?.imageMessage?.caption
													: msg.message?.videoMessage?.caption
														? msg.message?.videoMessage?.caption
														: "";
						const quotedM =
							msg.message?.extendedTextMessage?.contextInfo
								?.quotedMessage;
						const quotedMessage = quotedM?.viewOnceMessage?.message
							?.imageMessage?.caption
							? quotedM?.viewOnceMessage?.message?.imageMessage?.caption
								.trim()
								.split(" ")
							: quotedM?.viewOnceMessage?.message?.videoMessage
								?.caption
								? quotedM?.viewOnceMessage?.message?.videoMessage?.caption
									.trim()
									.split(" ")
								: quotedM?.viewOnceMessageV2?.message?.imageMessage
									?.caption
									? quotedM?.viewOnceMessageV2?.message?.imageMessage?.caption
										.trim()
										.split(" ")
									: quotedM?.viewOnceMessageV2?.message?.videoMessage
										?.caption
										? quotedM?.viewOnceMessageV2?.message?.videoMessage?.caption
											.trim()
											.split(" ")
										: quotedM?.extendedTextMessage?.text
											? quotedM?.extendedTextMessage?.text
												.trim()
												.split(" ")
											: quotedM?.conversation
												? quotedM?.conversation.trim().split(" ")
												: quotedM?.imageMessage?.caption
													? quotedM?.imageMessage?.caption.trim().split(" ")
													: quotedM?.videoMessage?.caption
														? quotedM?.videoMessage?.caption.trim().split(" ")
														: undefined;
						const normalizedMessage = message.trim();
						const isCommandMessage = (normalizedMessage.startsWith(prefix) || normalizedMessage.startsWith("chip")) && normalizedMessage.length > 1;
						const normalizeJid = (jid: string) => String(jid || "").replace(/:\d+(?=@)/, "");
						const botJid = normalizeJid(sock.user.id);
						const botLid = normalizeJid((sock.user as any).lid || "");
						const botIdentities = new Set([botJid, botLid].filter((id) => id.length > 0));
						const isGroupChat = msg.key.remoteJid.includes("g.us");
						const messageContextInfo: any = msg.message?.extendedTextMessage?.contextInfo
							|| msg.message?.imageMessage?.contextInfo
							|| msg.message?.videoMessage?.contextInfo
							|| msg.message?.viewOnceMessage?.message?.imageMessage?.contextInfo
							|| msg.message?.viewOnceMessage?.message?.videoMessage?.contextInfo
							|| msg.message?.viewOnceMessageV2?.message?.imageMessage?.contextInfo
							|| msg.message?.viewOnceMessageV2?.message?.videoMessage?.contextInfo;
						const quotedParticipant = normalizeJid(messageContextInfo?.participant || "");
						const mentionedJids = Array.isArray(messageContextInfo?.mentionedJid)
							? messageContextInfo.mentionedJid.map((jid: string) => normalizeJid(jid))
							: [];
						const shouldRespondByReplyToBot = quotedParticipant.length > 0 && botIdentities.has(quotedParticipant);
						const shouldRespondByMention = mentionedJids.some((jid: string) => botIdentities.has(jid));
						const mentionOnlyText = shouldRespondByMention
							? normalizedMessage
								.replace(/@[\w.-]+/g, "")
								.replace(/\s+/g, " ")
								.trim()
							: normalizedMessage;
						const shouldRespondByIdentifier = isGroupChat && hasBotIdentifierInText(normalizedMessage);
						const isGreetingMentionOnly = shouldRespondByMention && mentionOnlyText.length === 0;
						const messageKind = getIncomingMessageKind(msg, normalizedMessage);
						const sender = (msg.key as any).participantPn
							? (msg.key as any).participantPn.split("@")[0]
							: msg.key.participant
								? msg.key.participant.split("@")[0]
								: msg.key.remoteJid.split("@")[0];
						if (!isCommandMessage && (normalizedMessage.length > 0 || messageKind !== "text")) {
							const chatId = msg.key.remoteJid.split("@")[0];
							const normalizedContent = normalizedMessage.length > 0 ? normalizedMessage : `[${messageKind}]`;
							await saveConversation(chatId, "user", sender, normalizedContent, {
								source: "incoming",
								messageKind,
							});

							const memoryEnabled = await getConfig("chatMemory", chatId);
							const ollamaEnabled = await getConfig("ollamaAuto", chatId);
							if (memoryEnabled && ollamaEnabled) {
								const isPersonalChat = !isGroupChat;
								const groupPrompt = stripBotMentionsAndIdentifiers(normalizedMessage);
								if (isPersonalChat) {
									let response = "";
									const greetingCandidateText = stripBotMentionsAndIdentifiers(normalizedMessage);
									if (hasMenuWord(normalizedMessage)) {
										response = await buildCommandsMenu();
									} else if (isGreetingMessage(greetingCandidateText) || isGreetingMentionOnly) {
										response = buildGreetingReply();
									} else if (messageKind !== "text") {
										response = await buildPersonalMediaReply(messageKind);
									} else {
										response = await chatWithOllama(chatId, normalizedMessage);
									}

									if (response.trim().length > 0) {
										await saveConversation(chatId, "assistant", "bot", response, {
											source: "auto:ollama",
										});
										await sock.sendMessage(msg.key.remoteJid, { text: response }, { quoted: msg });
									}
								} else {
									const every = Math.max(1, Number(await getConfigValue("ollamaEvery", chatId, 50)) || 50);
									const nextCounter = (Number(await getConfigValue("ollamaCounter", chatId, 0)) || 0) + 1;
									await setConfigValue("ollamaCounter", chatId, nextCounter);
									const shouldRespondByInterval = nextCounter % every === 0;
									const shouldRespondByIdentifier = isGroupChat && hasBotIdentifierInText(normalizedMessage);
									const shouldRespondByContext = isMessageAboutBot(normalizedMessage) || shouldRespondByIdentifier;
									const greetingCandidateText = groupPrompt;
									const shouldRespondByMenuRequest = isGroupChat
										? hasMenuWord(normalizedMessage) && (shouldRespondByIdentifier || shouldRespondByMention)
										: hasMenuWord(normalizedMessage);
									if (shouldRespondByInterval || shouldRespondByContext || shouldRespondByReplyToBot || shouldRespondByMention || shouldRespondByIdentifier || shouldRespondByMenuRequest) {
										let response = "";
										if (isGreetingMessage(greetingCandidateText) || isGreetingMentionOnly) {
											response = buildGreetingReply();
										} else if (shouldRespondByMenuRequest) {
											response = await buildCommandsMenu();
										} else {
											response = await chatWithOllama(chatId, groupPrompt.length > 0 ? groupPrompt : normalizedMessage);
										}

										if (response.trim().length > 0) {
											await saveConversation(chatId, "assistant", "bot", response, {
												source: "auto:ollama",
											});
											await sock.sendMessage(
												msg.key.remoteJid,
												{ text: response },
												{ quoted: msg },
											);
										}
									}
								}
							}
						}
						await evalLevel(sock, msg, normalizedMessage)
						if (isCommandMessage) {
							const cmd = normalizedMessage.startsWith("chip") ? normalizedMessage.replace("chip ", "").split(" ").shift() : normalizedMessage.slice(prefix.length).trim().split(" ").shift().toLowerCase();
							const arg = normalizedMessage.replace("chip ", "").replace(cmd, "").slice(prefix.length).trim().split(" ")
							const args = [arg, quotedMessage];
							let cm: string = undefined
							for (let [key, value] of commands) {
								if (value.name === cmd) {
									cm = key
									break
								}
								if (value.alias.includes(cmd)) {
									cm = key
									break
								}
							}
							if (cm !== undefined) {
								const commFile = require(`./commands/${cm}`);
								try {
									commFile.run(sock, msg, args);
								} catch (e) {
									await sock.sendMessage(
										`${owner}@s.whatsapp.net`,
										{
											text: `Error al ejecutar ${commFile} - ${msg.key.remoteJid
												}\n ${String(e)}`,
										},
									);
									await sock.sendMessage(
										msg.key.remoteJid,
										{
											text: "Ocurrió un error inesperado.",
										},
										{ quoted: msg },
									);
								}
							} else {
								try {
									const chatId = msg.key.remoteJid.split("@")[0];
									const memoryEnabledCmd = await getConfig("chatMemory", chatId);
									const ollamaEnabledCmd = await getConfig("ollamaAuto", chatId);
									if (memoryEnabledCmd && ollamaEnabledCmd) {
										const userPrompt = normalizedMessage.length > 0 ? normalizedMessage : "";
										const response = await chatWithOllama(chatId, userPrompt);
										if (response && response.trim().length > 0) {
											await saveConversation(chatId, "assistant", "bot", response, { source: "auto:ollama" });
											await sock.sendMessage(msg.key.remoteJid, { text: response }, { quoted: msg });
										}
									}
								} catch (err) {
									console.error('Error auto-responding with Ollama for unknown command:', err);
								}
							}
						}
					}
				}
			}
		}
	});
	return sock;
};

startSock();
