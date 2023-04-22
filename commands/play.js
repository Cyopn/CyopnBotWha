const yts = require("youtube-sr").default;
const { ytSolver } = require("../lib/functions");
const yt = require("yt-converter");
const fs = require("fs");

module.exports.run = async (client, message, args, config) => {
	const { id, from } = message;
	const arg = args.join("");
	const isUrl = arg.match(
		/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gim
	);

	try {
		if (!arg)
			return await client.reply(
				from,
				`Envia el comando *${config.prefix}play [consulta/url]*`,
				id
			);
		await client.reply(from, `Espera un momento`, id);
		if (isUrl) {
			await ytSolver(args.join("")).then((r) => {
				if (r.status === 200) {
					client.sendFileFromUrl(
						from,
						`${r.thumb}`,
						`a.jpg`,
						`Inicia la descarga de *${r.title}*\nCanal/Autor: ${r.author}\nDuracion: ${r.time} minutos`,
						id
					);
					const tl = r.title.toString();
					yt.convertAudio(
						{
							url: args.join(""),
							itag: 140,
							directoryDownload: "./media/audio",
							title: `${tl}`,
						},
						function () {},
						function () {
							fs.readdir("./media/audio/", (err, files) => {
								if (err) return console.error(err);
								let file = files.filter(
									(f) => f.split(".").pop() === "mp3"
								);
								file.forEach((f) => {
									res = f;
								});
								client
									.sendFileFromUrl(
										from,
										`./media/audio/${res}`,
										`${res}.mp3`,
										`w`,
										id
									)
									.catch((e) => {
										console.error(
											`Error en play
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:
`,
											e.toString()
										);
										client.reply(
											from,
											`Es imposible enviar el audio, el achivo es demasiado largo`,
											id
										);
									});
								fs.unlink(`./media/audio/${res}`, function (e) {
									if (e) console.log(e);
								});
							});
						}
					);
				} else {
					console.error(
						`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
						e.toString()
					);
					client.reply(from, `Ocurrio un error`, id);
				}
			});
		} else {
			//Buscador
			if (false) {
			} else {
				const rs = await yts.search(args.join(" "), { limit: 5 });
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
					id
				);
				const filter = (m) =>
					m.author === message.author &&
					(m.quotedMsg ? m.quotedMsg.body : "").includes(
						"Responde este mensaje"
					);
				client
					.awaitMessages(from, filter, {
						max: 1,
						time: 60000,
						errors: ["time", "max"],
					})
					.then((c) => {
						const ob = Object.fromEntries(c);
						let k;
						for (const o in ob) {
							k = o;
						}
						const d = ob[k];
						let rss = parseInt(d.body);
						if (Number.isInteger(rss)) {
							if (rss > 5) {
								client.reply(
									from,
									`El numero excede al de las opciones
Intenta de nuevo`,
									id
								);
							} else {
								ytSolver(rs[rss - 1].url).then((r) => {
									if (r.status === 200) {
										client.sendFileFromUrl(
											from,
											`${r.thumb}`,
											`a.jpg`,
											`Inicia la descarga de *${r.title}*\nCanal/Autor: ${r.author}\nDuracion: ${r.time} minutos`,
											id
										);
										const tl = r.title.toString();
										yt.convertAudio(
											{
												url: rs[rss - 1].url,
												itag: 140,
												directoryDownload:
													"./media/audio",
												title: `${tl}`,
											},
											function () {},
											function () {
												fs.readdir(
													"./media/audio/",
													(err, files) => {
														if (err)
															return console.error(
																err
															);
														let file = files.filter(
															(f) =>
																f
																	.split(".")
																	.pop() ===
																"mp3"
														);
														file.forEach((f) => {
															res = f;
														});
														client
															.sendFileFromUrl(
																from,
																`./media/audio/${res}`,
																`${res}.mp3`,
																`w`,
																id
															)
															.catch((e) => {
																console.error(
																	`Error en play
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}: ${tl}
`,
																	e.toString()
																);
																client.reply(
																	from,
																	`Es imposible enviar el audio, el archivo es demasiado pesadoo`,
																	id
																);
															});
														fs.unlink(
															`./media/audio/${res}`,
															function (e) {
																if (e)
																	console.log(
																		e
																	);
															}
														);
													}
												);
											}
										);
									} else {
										console.error(
											`Error en play
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}: `,
											r.error
										);
										client.reply(
											from,
											`Ocurrio un error`,
											id
										);
									}
								});
							}
						} else {
							client.reply(
								from,
								`No se admiten caracteres
Intenta de nuevo`,
								id
							);
						}
					})
					.catch((e) => {
						if (e.size == 0) {
							client.reply(
								from,
								`El tiempo se ha agotado
Intenta de nuevo`,
								id
							);
						}
					});
			}
		}
	} catch (e) {
		console.error(
			`Error en ${this.config.name}
Hora: ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}:`,
			e.toString()
		);
		await client.reply(from, `Ocurrio un error`, id);
	}
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: "play",
	aliases: "p",
	desc: "Descarga una cancion",
};
