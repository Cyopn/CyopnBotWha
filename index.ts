import { Boom } from "@hapi/boom";

import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
} from "@whiskeysockets/baileys";
const MAIN_LOGGER = require("@whiskeysockets/baileys/lib/Utils/logger").default;
import fs from "fs";
import * as http from "http";
let command = [];
let alias = [];
require("dotenv").config();
const { prefix, owner, channel } = process.env;
const logger = MAIN_LOGGER.child({});
logger.level = "silent";
// Hosting
const server = http.createServer((_req, res) => {
	res.statusCode = 200;
	res.setHeader("Content-Type", "text/plain");
	res.end("w");
});
const port = 3000;
//const hostname = "0.0.0.0"; // En replit
const hostname = "localhost"; // En local
server.listen(port, hostname, () => {
	console.log(`Servidor corriendo en http://${hostname}:${port}/`);
});
// Hosting
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
						const message = msg.message?.extendedTextMessage?.text
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
						const quotedMessage = quotedM?.extendedTextMessage?.text
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
						}
					}
				}
			}
		}
	});
	return sock;
};

startSock();
