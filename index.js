const { Boom } = require("@hapi/boom");
const {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	useMultiFileAuthState,
	makeWASocket,
} = require("@whiskeysockets/baileys");
const MAIN_LOGGER = require("@whiskeysockets/baileys/lib/Utils/logger").default;
const fs = require("fs");
let command = [];
let alias = [];
const { prefix, owner } = require("./config.json");
const logger = MAIN_LOGGER.child({});
logger.level = "silent";
// Hosting
/* const keep = () => {
	const http = require("http");
	http.createServer(function (req, res) {
		
		res.write("w");
		res.end();
	}).listen(8080);
};
keep(); */
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
					new Boom(lastDisconnect?.error)?.output?.statusCode !==
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
				text: `Gracias por invitarme.\nUsa !help para ver los comandos disponibles.\nCualquier duda o sugerencia sera respondida:\nWhatsapp: wa.me/+5215633592644\nInstagram: https://www.instagram.com/cyopn_/`,
			});
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
											text: String(e),
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
