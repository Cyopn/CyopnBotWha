const fs = require("fs");
let command = [];
let alias = [];
const config = require("./config.json");
const { evalLevel, getAfk, solveAfk } = require("./lib/functions");

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

module.exports = async (client, message) => {
	const {
		quotedMsg,
		isGroupMsg,
		mentionedJidList,
		isMedia,
		from,
		author,
		id,
	} = message;
	let body = isMedia
		? message.caption
			? message.caption
			: ""
		: message.body;
	if (isGroupMsg) {
		if (mentionedJidList && mentionedJidList[0]) {
			const r = await getAfk(
				from.replace("@g.us", ""),
				mentionedJidList[0].replace("@c.us", ""),
			);
			if (r !== undefined)
				return await client.reply(
					from,
					`El miembro que haz mencionado no esta disponible por el momento, intenta mas tarde.\nRazon: _${r}_`,
					id,
				);
		}
		await evalLevel(client, message);
		if (
			await solveAfk(
				from.replace("@g.us", ""),
				author.replace("@c.us", ""),
			)
		)
			await client.reply(
				from,
				`A partir de ahora ha terminado tu periodo de inactividad.`,
				id,
			);
	}
	let q = quotedMsg
		? quotedMsg.isMedia && quotedMsg.caption
			? quotedMsg.caption.trim().split(" ")
			: quotedMsg.body.trim().split(" ")
		: undefined;
	if (body.startsWith(config.prefix)) {
		const arg = body.slice(config.prefix.length).trim().split(" ");
		const cmd = arg.shift().toLowerCase();
		const args = [arg, q];
		const cm =
			command.indexOf(cmd) === -1
				? alias.indexOf(cmd)
				: command.indexOf(cmd);
		if (cm >= 0) {
			const commFil = command[cm];
			const commFile = require(`./commands/${commFil}`);
			await client.simulateTyping(from, true);
			try {
				commFile.run(client, message, args);
			} catch (e) {
				console.log(e);
			}
		}
	}
};
