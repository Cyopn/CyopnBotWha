const fs = require("fs");
let command = [];
let alias = [];
const config = require("./config.json");
const { lvlFunc, getAfk } = require("./lib/functions");

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
	const { body, quotedMsg, isGroupMsg } = message;
	if (isGroupMsg) {
		if (mentionedJidList && mentionedJidList[0]) {
			await getAfk(client, message);
		}
		await lvlFunc(client, message);
	}
	let q = quotedMsg ? quotedMsg.body.trim().split(" ") : undefined;
	if (body.startsWith(config.prefix)) {
		const arg = body.slice(config.prefix.length).trim().split(" ");
		const cmd = arg.shift().toLowerCase();
		const args = [arg, q];
		const cm =
			command.indexOf(cmd) === -1
				? alias.indexOf(cmd)
				: command.indexOf(cmd);
		if (cm >= 0) {
			const commFil = command[sr];
			const commFile = require(`./commands/${commFil}`);
			commFile.run(message, args);
		}
	}
};
