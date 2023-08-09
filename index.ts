import { Boom } from "@hapi/boom";
import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";
import fs from "fs";
let command: String[] = [];
let alias: String[] = [];
import config from "./config.json";

const logger = MAIN_LOGGER.child({});
logger.level = "silent";

fs.readdir("./commands/", (err: Error, files: String[]) => {
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

		if (events["messages.upsert"]) {
			const upsert = events["messages.upsert"];
			if (upsert.type === "notify") {
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
						if (message.startsWith(config.prefix)) {
							const arg = message
								.slice(config.prefix.length)
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
									console.log(e);
								}
							}
							/* sock.sendMessage(msg.key.remoteJid, {
								caption: "",
								image: { url: `` },
							}); */
						}
					}
				}
			}
		}
	});

	return sock;
};

startSock();
