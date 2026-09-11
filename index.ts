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

require("dotenv").config();
const { msgStorage } = require("./lib/functions.js");
const { processGroup, evalLevel, getAllGroupSettings, setGroupSetting } = require("./lib/db.js");
const { getMetrics, getRecentErrors, getSuggestions, recordCommandMetric, recordMessageMetric } = require("./lib/admin_data.js");
const { getAccessRegistry, isAuthorized, isCommandEnabled, isTrackableMessage, registerAccessMessage, setCommandEnabled, setGroupEnabled, setGroupUserBlocked, updateList } = require("./lib/access.js");
const { renderAdminPage } = require("./lib/admin_view.js");
const { prefix, owner, channel, port, bot } = process.env;
const express = require("express");
const bodyParser = require("body-parser");
const msgRetryCounterCache = new NodeCache<any>()
const logger = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./logs.txt'))
logger.level = 'silent'

let commands: Map<string, { name: string, alias: string[], description: string }> = new Map()
const URL_WORDS_REGEX = /(https?:\/\/|www\.|t\.me\/|wa\.me\/)/i;

const app = express();
app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	}),
);
const adminAuth = (request, response, next) => {
	const expectedUser = process.env.ADMIN_PANEL_USER;
	const expectedPassword = process.env.ADMIN_PANEL_PASSWORD;
	if (!expectedUser || !expectedPassword) {
		return response.status(503).send("Panel no configurado: establece ADMIN_PANEL_USER y ADMIN_PANEL_PASSWORD.");
	}
	const header = request.headers.authorization || "";
	if (!header.startsWith("Basic ")) {
		response.set("WWW-Authenticate", 'Basic realm="CyopnBot Admin"');
		return response.status(401).send("Autenticacion requerida.");
	}
	const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
	const separator = decoded.indexOf(":");
	const user = separator >= 0 ? decoded.slice(0, separator) : "";
	const password = separator >= 0 ? decoded.slice(separator + 1) : "";
	if (user !== expectedUser || password !== expectedPassword) {
		response.set("WWW-Authenticate", 'Basic realm="CyopnBot Admin"');
		return response.status(401).send("Credenciales invalidas.");
	}
	next();
};
app.get("/", (request, response) => {
	response.json({ info: "En linea" });
});
app.get("/access", adminAuth, async (request, response) => {
	try {
		response.json(await getAccessRegistry());
	} catch (error) {
		response.status(500).json({ error: String(error) });
	}
});
app.get("/admin", adminAuth, async (request, response) => {
	try {
		const registry = await getAccessRegistry();
		registry.groupSettings = await getAllGroupSettings();
		registry.groups = Object.fromEntries(Object.entries(registry.groups).map(([id, group]) => [id, { ...(group as Record<string, any>), settings: registry.groupSettings[id] || {} }]));
		registry.metrics = await getMetrics();
		registry.errors = await getRecentErrors();
		registry.suggestions = await getSuggestions();
		const commandList = Array.from(commands.values()).sort((a, b) => a.name.localeCompare(b.name));
		response.send(renderAdminPage({ ...registry, commands: commandList }));
	} catch (error) {
		response.status(500).send(String(error));
	}
});
app.post("/admin/access", adminAuth, async (request, response) => {
	try {
		const { action, list, value } = request.body || {};
		if (action === "group") await setGroupEnabled(request.body.groupId, request.body.enabled === "true");
		if (action === "participant") await setGroupUserBlocked(request.body.groupId, request.body.userId, request.body.blocked === "true");
		if (action === "group-setting") await setGroupSetting(request.body.groupId, request.body.setting, request.body.value === "true");
		if (action === "user") {
			await updateList("blacklistUsers", request.body.userId, request.body.allowed === "true" ? "remove" : "add");
		}
		if (action === "add" && ["blacklistGroups", "blacklistUsers"].includes(list)) await updateList(list, value, "add");
		if (action === "remove" && ["blacklistGroups", "blacklistUsers"].includes(list)) await updateList(list, value, "remove");
		response.redirect("/admin");
	} catch (error) {
		response.status(500).send(String(error));
	}
});
app.post("/admin/commands", adminAuth, async (request, response) => {
	try {
		const { command, enabled } = request.body || {};
		if (Array.from(commands.values()).some((item) => item.name === command)) await setCommandEnabled(command, enabled === "true");
		response.redirect("/admin");
	} catch (error) {
		response.status(500).send(String(error));
	}
});
app.listen(port, () => {
	console.log(`Aplicacion corriendo en el puerto ${port}.`);
});
fs.readdir(`./commands/`).then((files) => {
	let jsfile = files.filter((f) => f.split(".").pop() === "js");
	if (jsfile.length <= 0) return console.log("No se encontró ningún comando");
	jsfile.forEach((f) => {
		let pull = require(`./commands/${f}`);
		commands.set((f.split(".")[0]), { "name": pull.config.name, "alias": pull.config.alias, "description": pull.config.description || "" })
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
												: quotedM?.videoMessage?.caption
													? quotedM?.videoMessage?.caption.trim().split(" ")
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
