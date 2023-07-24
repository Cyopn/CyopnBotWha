const { prefix } = require("../config.json");
const ex = require("child_process").execSync;
const fsPromises = require("fs/promises");
const { loadJson } = require("../lib.old/functions");

module.exports.run = async (client, message, args) => {
	const { id, from } = message;
	try {
		const rs = ex(`python ./lib/pylib/meme.py`, { encoding: "utf8" });
		loadJson().then((rs) => {
			if (rs != undefined) {
				client.sendFileFromUrl(
					from,
					rs.url,
					"yo.jpg",
					`${rs.title}
    Publicado por u/${rs.author}`,
					id,
				);
			}
		});
	} catch (e) {}

	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `meme`,
	alias: `m`,
	type: ``,
	description: ``,
	fulldesc: ``,
};
