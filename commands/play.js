require("dotenv").config();
const { prefix, owner } = process.env;
const { ytSolver } = require("../lib/functions");
const yt = require("yt-converter");
const yts = require("youtube-sr").default;
const fs = require("fs");

module.exports.run = async (sock, msg, args) => {
	let arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	if (!arg)
		return sock.sendMessage(
			msg.key.remoteJid,
			{
				text: `Debes proporcionar un enlace, escribe ${prefix}play (enlace o busqueda), recuerda que no es necesario escribir los parentesis.`,
			},
			{ quoted: msg },
		);
	const isurl = arg.match(
		/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gim,
	);
	try {
		/* if (fs.existsSync("./temp/thumb.jpg")) {
			fs.unlinkSync("./temp/thumb.jpg");
		} */
		if (isurl) {
			const { status, title, author, error, time, thumb } =
				await ytSolver(arg);
			if (status === 200) {
				/* await axios
					.get(thumb, { responseType: "arraybuffer" })
					.then((r) => {
						console.log(r.data);
						fs.writeFileSync("./temp/thumb.jpg", r.data);
						sock.sendMessage(
							msg.key.remoteJid,
							{
								caption: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
								image: { url: r.data },
							},
							{ quoted: msg },
						);
					})
					.catch((e) => {
						console.log(e);
					}); */
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
					},
					{ quoted: msg },
				);
				yt.convertAudio(
					{
						url: arg,
						itag: 140,
						directoryDownload: "./temp/",
						title: title,
					},
					(t) => {},
					async () => {
						const [w] = fs
							.readdirSync("./temp/")
							.filter((f) => f.split(".").pop() === "mp3");
						await sock.sendMessage(
							msg.key.remoteJid,
							{
								audio: {
									url: `./temp/${w}`,
								},
								mimetype: "audio/mpeg",
							},
							{ quoted: msg },
						);
						fs.unlinkSync(`./temp/${w}`);
					},
				);
			} else {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `El enlace no es valido.`,
					},
					{ quoted: msg },
				);
			}
		} else {
			arg = args[1] === undefined ? args[0].join(" ") : args[1].join(" ");
			const [rs] = await yts.search(arg, { limit: 1 });
			const { status, title, author, error, time, thumb } =
				await ytSolver(rs.url);
			if (status === 200) {
				/* await axios
					.get(thumb, { responseType: "arraybuffer" })
					.then(async (r) => {
						fs.writeFileSync("./temp/thumb.jpg", r.data);
						await sock.sendMessage(
							msg.key.remoteJid,
							{
								caption: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
								image: { url: "./temp/thumb.jpg" },
							},
							{ quoted: msg },
						);

						fs.unlinkSync("./temp/thumb.jpg");
					})
					.catch((e) => {
						console.log(e);
					}); */
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
					},
					{ quoted: msg },
				);
				yt.convertAudio(
					{
						url: rs.url,
						itag: 140,
						directoryDownload: "./temp/",
						title: title,
					},
					(t) => {},
					async () => {
						const [w] = fs
							.readdirSync("./temp/")
							.filter((f) => f.split(".").pop() === "mp3");
						await sock.sendMessage(
							msg.key.remoteJid,
							{
								audio: {
									url: `./temp/${w}`,
								},
								mimetype: "audio/mpeg",
							},
							{ quoted: msg },
						);
						fs.unlinkSync(`./temp/${w}`);
					},
				);
			} else {
				await sock.sendMessage(
					msg.key.remoteJid,
					{
						text: `No se encontro nada.`,
					},
					{ quoted: msg },
				);
			}
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
	name: `play`,
	alias: `p`,
	type: `misc`,
	description: `Descarga en forma de audio un video de youtube, ya sea con el enlace o una busqueda.`,
	fulldesc: `Comando para descargar (en forma de audio) algun video de youtube, usa este comando escribiendo ${prefix}play (enlace o busqueda) o su alias, ${prefix}p (enlace o busqueda) o su alias, recuerda que no es necesario escribir los corchetes. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
