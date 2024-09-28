require("dotenv").config();
const { prefix, owner } = process.env;
const { errorHandler } = require("../lib/functions");
const axios = require("axios");

module.exports.run = async (sock, msg) => {
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
		await errorHandler(sock, msg, this.config.name, e);
	}
};

module.exports.config = {
	name: `meme`,
	alias: `m`,
	type: `misc`,
	description: `Envia un chistorete digital publicado en reddit.com/r/ChingaTuMadreNoko/ ¡Conviertete en colaborador!`,
	fulldesc: `Nada que agregar.`,
};
