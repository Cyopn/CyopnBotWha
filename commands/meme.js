require("dotenv").config();
const { prefix, owner } = process.env;
const fs = require("fs");
const axios = require("axios");

module.exports.run = async (sock, msg, args) => {
	try {
		const response = await axios.get(
			`https://www.reddit.com/r/chingatumadrenoko.json`,
		);
		const posts = response.data.data.children;
		const random = Math.floor(Math.random() * posts.length);
		await sock.sendMessage(
			msg.key.remoteJid,
			{
				caption: "w",
				image: { url: posts[random].data.url },
			},
			{ quoted: msg },
		);
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
	description: `Envia un chistorete digital publicado en reddit.com/r/ChingaTuMadreNoko/ ¡Conviertete en colaborador!`,
	fulldesc: `Nada que agregar.`,
};
