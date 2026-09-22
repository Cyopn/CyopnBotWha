import { Boom } from "@hapi/boom";
import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import fs from "fs/promises";
import NodeCache from '@cacheable/node-cache'
import P from 'pino'
import sleep from 'ko-sleep'
import { createApp } from "./app";

require("dotenv").config();
const { msgStorage } = require("./lib/functions.js");
const { processGroup, evalLevel, getAllGroupSettings, setGroupSetting } = require("./lib/db.js");
const { getMetrics, getRecentErrors, getSuggestions, recordCommandMetric, recordMessageMetric } = require("./lib/admin_data.js");
const { getAccessRegistry, isAuthorized, isCommandEnabled, isTrackableMessage, registerAccessMessage, setCommandEnabled, setGroupEnabled, setGroupUserBlocked, updateList } = require("./lib/access.js");
const { renderAdminPage } = require("./lib/admin_view.js");
const { prefix, owner, channel, port, bot } = process.env;

const msgRetryCounterCache = new NodeCache<any>()
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./logs.txt'))
logger.level = 'silent'

let commands: Map<string, { name: string, alias: string[], description: string }> = new Map()

fs.readdir(`./commands/`).then((files) => {
	let jsfile = files.filter((f) => f.split(".").pop() === "js");
	if (jsfile.length <= 0) return console.log("No se encontró ningún comando");
	jsfile.forEach((f) => {
		let pull = require(`./commands/${f}`);
		commands.set((f.split(".")[0]), { "name": pull.config.name, "alias": pull.config.alias, "description": pull.config.description || "" })
	});
})

createApp(commands).listen(process.env.port || 3000, () => {
	console.log(`Servidor Express corriendo en el puerto ${process.env.port || 3000}`);
});

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

		if (events['call']) {
			const calls = events['call']
			for (const call of calls) {
				for (const call of events['call']) {
					if (call.status === "offer") {
						await sock.rejectCall(call.id, call.from);
					}
				}
			}
		}

		if (events["creds.update"]) {
			await saveCreds();
		}

		if (events["groups.upsert"]) {
			const [metadata] = events["groups.upsert"];
			await sock.sendMessage(metadata.id, {
				text: `Hola, soy un bot multipropósito.\nUsa !help para ver los comandos disponibles.\nCualquier duda o sugerencia será respondida en:\nWhatsApp: wa.me/+${owner}\nInstagram: https://www.instagram.com/cyopn_/\n*Nota importante*: El administrador del bot/número tendrá acceso a este chat.\nSigue el canal de información para estar al día de novedades y actualizaciones: ${channel}`,
			});
		}

		if (events["messages.upsert"]) {
			const upsert = events["messages.upsert"];
			if (upsert.type === "append" || upsert.type === "notify") {
				for (const msg of upsert.messages) {
					if (msg.key.fromMe) continue;
					if (!isTrackableMessage(msg)) continue;
					await recordMessageMetric(msg);
					await registerAccessMessage(msg, sock);
					await processGroup(msg);
					await msgStorage(msg);
					if (!(await isAuthorized(msg))) continue;
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
												: msg.message?.videoMessage?.caption
													? msg.message?.videoMessage?.caption.trim().split(" ")
													: undefined;
					const normalizedMessage = message.trim();
					const isCommandMessage = (normalizedMessage.startsWith(prefix) || normalizedMessage.startsWith("chip")) && normalizedMessage.length > 1;
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
							if (!(await isCommandEnabled(commands.get(cm).name))) continue;
							await recordCommandMetric(commands.get(cm).name, msg);
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
						}
					}
				}
			}
		}
	});
	return sock;
};

startSock();