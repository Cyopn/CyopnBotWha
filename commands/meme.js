require("dotenv").config();
const { prefix, owner } = process.env;
const ex = require("child_process").execSync;
const fs = require("fs");

module.exports.run = async (sock, msg, args) => {
	try {
		const rs = ex(`python ./lib/pylib/meme.py`, { encoding: "utf8" });
		if (String(rs).includes("ok")) {
			const data = fs.readFileSync("./temp/praw.json");
			const { title, author, url } = JSON.parse(data);
			if (url.includes("jpg") || url.includes("png")) {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						image: { url: url },
						caption: `${title}\nPublicado por u/${author}`,
					},
					{ quoted: msg },
				);
			} else {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						video: { url: rs.url },
						caption: `${title}\nPublicado por u/${author}`,
					},
					{ quoted: msg },
				);
			}
		}
	} catch (e) {
		await sock.sendMessage(`${owner}@s.whatsapp.net`, {
			text: `Error en ${this.config.name} - ${
				msg.key.remoteJid
			}\n${String(e)}`,
		});
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				text: "Ocurrio un error inesperado.",
			},
			{ quoted: msg },
		);
	}
};

module.exports.config = {
	name: `meme`,
	alias: `m`,
	type: `misc`,
	description: `Envia un chistorete digital publicado en reddit.com/r/ChingaTuMadreNoko/_ \n_¡Conviertete en colaborador!`,
	fulldesc: `Nada que agregar.`,
};
