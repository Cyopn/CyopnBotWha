const { prefix } = require("../config.json");
const yts = require("youtube-sr").default;
const { ytSolver } = require("../lib/functions");
const yt = require("yt-converter");
const fs = require("fs");

module.exports.run = async (client, message, args) => {
	const { id, from } = message;
	let arg = args[1] === undefined ? args[0].join("") : args[1].join("");

	if (!arg)
		return await client.reply(
			from,
			`Debes proporcionar un enlace, escribe ${prefix}play (enlace de youtube o busqueda), recuerda que no es necesario escribir los parentesis.`,
			id,
		);
	const isUrl = arg.match(
		/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gim,
	);
	if (isUrl) {
		const { status, title, author, error, time, thumb } = await ytSolver(
			arg,
		);
		let titl = title
			.replaceAll(",", "")
			.replaceAll("\\", "")
			.replaceAll("/", "")
			.replaceAll(":", "")
			.replaceAll("*", "")
			.replaceAll("?", "")
			.replaceAll('"', "")
			.replaceAll("<", "")
			.replaceAll(">", "")
			.replaceAll("|", "");
		if (status === 200) {
			client.sendFileFromUrl(
				from,
				`${thumb}`,
				`a.jpg`,
				`Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
				id,
			);
			yt.convertAudio(
				{
					url: arg,
					itag: 140,
					directoryDownload: "./media/audio",
					title: titl,
				},
				() => {},
				() => {
					client.sendFile(
						from,
						`./media/audio/${titl}.mp3`,
						`${title}.mp3`,
						`w`,
						id,
					);
					fs.unlink(`./media/audio/${titl}.mp3`, (e) => {
						if (e) console.log(e);
					});
				},
			);
		}
	} else {
		arg = args[1] === undefined ? args[0].join(" ") : args[1].join(" ");
		const rs = await yts.search(arg, { limit: 5 });
		a = 1;
		txt = "Resultados";
		rs.forEach((r) => {
			txt += `
${a}-. Titulo: ${r.title}
Duracion: ${r.durationFormatted}
Autor/Canal: ${r.channel.name}
`;
			a += 1;
		});
		await client.reply(
			from,
			(txt +=
				"\nResponde este mensaje con la opcion (numero) a descargar\nEl tiempo de espera es de solo un minuto"),
			id,
		);
		const filter = (m) =>
			m.author === message.author &&
			(m.quotedMsg ? m.quotedMsg.body : "").includes(
				"Responde este mensaje",
			);
		client
			.awaitMessages(from, filter, {
				max: 1,
				time: 60000,
				errors: ["time", "max"],
			})
			.then((r) => {
				const ob = Object.fromEntries(r);
				let k;
				for (const o in ob) {
					k = o;
				}
				const msg = ob[k];
				let index = parseInt(msg.body);
				if (Number.isInteger(index)) {
					if (index > 5) {
						client.reply(
							from,
							`El numero excede al de las opciones\nIntenta de nuevo`,
							id,
						);
					} else {
						ytSolver(rs[index - 1].url).then((r) => {
							const {
								status,
								title,
								author,
								error,
								time,
								thumb,
							} = r;
							let titl = title
								.replaceAll(",", "")
								.replaceAll("\\", "")
								.replaceAll("/", "")
								.replaceAll(":", "")
								.replaceAll("*", "")
								.replaceAll("?", "")
								.replaceAll('"', "")
								.replaceAll("<", "")
								.replaceAll(">", "")
								.replaceAll("|", "");
							if (status === 200) {
								client.sendFileFromUrl(
									from,
									`${thumb}`,
									`a.jpg`,
									`Inicia la descarga de *${title}*\nCanal/Autor: ${author}\nDuracion: ${time} minutos`,
									id,
								);
								yt.convertAudio(
									{
										url: rs[index - 1].url,
										itag: 140,
										directoryDownload: "./media/audio",
										title: titl,
									},
									() => {},
									() => {
										client.sendFile(
											from,
											`./media/audio/${titl}.mp3`,
											`${title}.mp3`,
											`w`,
											id,
										);
										fs.unlink(
											`./media/audio/${titl}.mp3`,
											(e) => {
												if (e) console.log(e);
											},
										);
									},
								);
							}
						});
					}
				}
			});
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `play`,
	alias: `p`,
	type: ``,
	description: ``,
	fulldesc: ``,
};
