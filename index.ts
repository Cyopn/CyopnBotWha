import { Boom } from "@hapi/boom";

import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
} from "@whiskeysockets/baileys";
const MAIN_LOGGER = require("@whiskeysockets/baileys/lib/Utils/logger").default;
import fs from "fs";
const { solveAfk, getAfk, evalLevel } = require("./lib/functions.js");
let command = [];
let alias = [];
require("dotenv").config();
const { prefix, owner, channel } = process.env;
const logger = MAIN_LOGGER.child({});
logger.level = "silent";
//Hosting
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3001;

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
//Hosting
fs.readdir("./commands/", (err, files) => {
	if (err) return console.error(err);
	let jsfile = files.filter((f) => f.split(".").pop() === "js");
	if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
	jsfile.forEach((f) => {
		let pull = require(`./commands/${f}`);
		command.push(pull.config.name);
		alias.push(pull.config.alias);
	});
});
const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState("auth_info");
	const { version } = await fetchLatestBaileysVersion();

	const sock = makeWASocket({
		version,
		logger,
		printQRInTerminal: true,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
	});
	console.log("Cliente listo");
	sock.ev.process(async (events) => {
		if (events["connection.update"]) {
			const update = events["connection.update"];
			const { connection, lastDisconnect } = update;
			if (connection === "close") {
				if (
					(lastDisconnect?.error as Boom)?.output?.statusCode !==
					DisconnectReason.loggedOut
				) {
					console.log("Reconectando");
					startSock();
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
					if (!msg.key.fromMe) {
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
						/* const { remoteJid, participant } = msg.key;
						const gid = remoteJid.split("@")[0];
						const uid =
							participant !== undefined
								? participant.split("@")[0]
								: remoteJid.split("@")[0];
						if (msg.key.remoteJid.includes("g.us")) {
							await evalLevel(sock,msg, message);
							const mentionMsg = message.split(" ");
							for (let i = 0; i < mentionMsg.length; i++) {
								if (mentionMsg[i].includes("@")) {
									const mention = mentionMsg[i]
										.split("@")[1]
										.split("]")[0];
									const reg = new RegExp("^[0-9]+$");
									if (reg.test(mention)) {
										const afk = await getAfk(gid, mention);
										if (afk !== undefined) {
											await sock.sendMessage(
												msg.key.remoteJid,
												{
													text: `El usuario @${mention} no esta disponible. \nRazon: ${afk}.`,
													mentions: [
														`${mention}@s.whatsapp.net`,
													],
												},
												{ quoted: msg },
											);
										}
									}
								}
							}
						} */
						if (message.startsWith(prefix) && message.length > 1) {
							const arg = message
								.slice(prefix.length)
								.trim()
								.split(" ");
							const cmd = arg.shift().toLowerCase();
							const args = [arg, quotedMessage];
							const cm =
								command.indexOf(cmd) === -1
									? alias.indexOf(cmd)
									: command.indexOf(cmd);
							if (cm >= 0) {
								const commFil = command[cm];
								const commFile = require(`./commands/${commFil}`);
								/* if (commFile.config.name.includes("afk")) {
									if (msg.key.remoteJid.includes("g.us")) {
										if (await solveAfk(gid, uid, "dep")) {
											await sock.sendMessage(
												msg.key.remoteJid,
												{
													text: `Tu tiempo de inactividad ha terminado. Bienvenido de vuelta.`,
												},
												{ quoted: msg },
											);
										}
									}
								} */
								try {
									commFile.run(sock, msg, args);
								} catch (e) {
									await sock.sendMessage(
										`${owner}@s.whatsapp.net`,
										{
											text: `Error al ejecutar ${commFil} - ${
												msg.key.remoteJid
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
						} else {
							/* if (msg.key.remoteJid.includes("g.us")) {
								if (await solveAfk(gid, uid, "none")) {
									await sock.sendMessage(
										msg.key.remoteJid,
										{
											text: `Tu tiempo de inactividad ha terminado. Bienvenido de vuelta.`,
										},
										{ quoted: msg },
									);
								}
							} */
						}
					}
				}
			}
		}
	});
	return sock;
};

startSock();
