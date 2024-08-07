require("dotenv").config();
const { prefix, owner } = process.env;
const axios = require("axios");

module.exports.run = async (sock, msg, args) => {
	try {
		const response = await axios.get(
			`https://www.reddit.com/r/chingatumadrenoko.json`,
		);
		const posts = response.data.data.children;
		const random = Math.floor(Math.random() * posts.length);
		const post = posts[random].data;
		if (post.is_video) {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					caption: `${post.title}\nPublicado por u/${post.author}`,
					video: { url: post.media.reddit_video.fallback_url },
				},
				{ quoted: msg },
			);
		} else {
			await sock.sendMessage(
				msg.key.remoteJid,
				{
					caption: `${post.title}\nPublicado por u/${post.author}`,
					image: { url: post.url },
				},
				{ quoted: msg },
			);
		}
	} catch (e) {
		const sub = msg.key.remoteJid.includes("g.us")
			? await sock.groupMetadata(msg.key.remoteJid)
			: {
				subject: msg.key.remoteJid.replace("@s.whatsapp.net", ""),
			};
		await sock.sendMessage(`${owner}@s.whatsapp.net`, {
			text: `Error en ${this.config.name} - ${sub.subject}\n${String(e)}`,
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
	description: `Envia un chistorete digital publicado en reddit.com/r/ChingaTuMadreNoko/ ¡Conviertete en colaborador!`,
	fulldesc: `Nada que agregar.`,
};
