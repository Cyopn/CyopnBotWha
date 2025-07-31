import { Boom } from "@hapi/boom";
import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import fs from "fs/promises";
const { msgStorage, processGroup, evalLevel } = require("./lib/functions.js");
require("dotenv").config();
const { prefix, owner, channel, port, bot } = process.env;
const express = require("express");
const bodyParser = require("body-parser");
import NodeCache from '@cacheable/node-cache'
import P from 'pino'
import sleep from 'ko-sleep'
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./logs.txt'))
logger.level = 'silent'
const msgRetryCounterCache = new NodeCache<any>()

let commands: Map<string, { name: string, alias: string[] }> = new Map()
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
	if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
	jsfile.forEach((f) => {
		let pull = require(`./commands/${f}`);
		commands.set((f.split(".")[0]), { "name": pull.config.name, "alias": pull.config.alias })
	});
})

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
					console.log('COnexion cerrada, sin sesion.')
				}
			}
		}

		if (events["creds.update"]) {
			await saveCreds();
		}

		if (events["groups.upsert"]) {
			const [metadata] = events["groups.upsert"];
			await sock.sendMessage(metadata.id, {
				text: `Gracias por invitarme.
Usa !help para ver los comandos disponibles.
Cualquier duda o sugerencia sera respondida:
Whatsapp: wa.me/+5215633592644\nInstagram: https://www.instagram.com/cyopn_/
*Nota importante*: El administrador del bot/numero tendra acceso a este chat.
Sigue el canal de informacion para estar al dia de las novedades y actualizaciones: ${channel}`,
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
						await evalLevel(sock, msg, message)
						if ((message.startsWith(prefix) || message.startsWith("chip")) && message.length > 1) {
							const cmd = message.startsWith("chip") ? message.replace("chip ", "").split(" ").shift() : message.slice(prefix.length).trim().split(" ").shift().toLowerCase();
							const arg = message.replace("chip ", "").replace(cmd, "").slice(prefix.length).trim().split(" ")
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
											text: "Ocurrio un error inesperado.",
										},
										{ quoted: msg },
									);
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
