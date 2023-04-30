const { create, Client, ev } = require("@open-wa/wa-automate");
const config = require("./config.json");
const handler = require("./handler");
const d = new Date();
const { loadDatabase } = require("./lib/functions");

const start = async (client = new Client()) => {
	console.log(
		`[SR] Cliente listo - ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
	);
	await loadDatabase(client);
	//Nota: Debe existir una conversacion anterior entre el numero del propietario y el numero que hosteara el bot, de otro modo, el aviso no se enviara
	await client.sendText(`${config.owner}@c.us`, "Cliente listo");
	await client.onStateChanged((state) => {
		console.log(
			`[SR] ${state} - ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
		);
		if (state === "CONFLICT" || state === "UNLAUNCHED") {
			client.forceRefocus();
		}
	});

	await client.onMessage(async (message) => {
		await handler(client, message);
	});
};

create({
	sessionId: "Cyopn",
	headless: true,
	qrTimeout: 0,
	authTimeout: 0,
	cacheEnabled: false,
	useChrome: true,
	killProcessOnBrowserClose: true,
	throwErrorOnTosBlock: true,
	chromiumArgs: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--aggressive-cache-discard",
		"--disable-cache",
		"--disable-application-cache",
		"--disable-offline-load-stale-cache",
		"--disk-cache-size=0",
	],
	onError: "AS_STRING",
})
	.then((client) => start(client))
	.catch((e) => console.log(`Error al iniciar cliente: ${e.message}`));
