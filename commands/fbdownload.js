const { prefix } = require("../config.json");
const { facebookdl } = require("@bochilteam/scraper");

module.exports.run = async (client, message, args) => {
	const { id, from } = message;
	const arg =
		args[1] !== undefined && args[1].match(/www.facebook.com|fb.watch/g)
			? args[1].join("")
			: args[0].join("");

	const isUrl = arg.match(/www.facebook.com|fb.watch/g);
	if (!arg)
		return await client.reply(
			from,
			`Debes proporcionar un enlace, escribe ${prefix}fbdownload (enlace), recuerda que no es necesario escribir los parentesis.`,
			id
		);
	if (!isUrl)
		return await client.reply(
			from,
			`El enlace proporcionado no es valido.`,
			id
		);
	const r = await facebookdl(arg);
	let rs = null;
	let q = 0;
	r.result.forEach((w) => {
		if (
			w.ext === "mp4" &&
			!isNaN(parseInt(w.quality)) &&
			parseInt(w.quality) > q &&
			!w.url.includes(`youtube4kdownloader`)
		) {
			rs = w.url;
			q = parseInt(w.quality);
		}
	});
	await client.sendFileFromUrl(from, rs, "nose", `w`, id);
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `fbdownload`,
	alias: `fbdl`,
	type: `misc`,
	description: ``,
	fulldesc: ``,
};
