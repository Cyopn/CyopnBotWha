const { prefix } = require("../config.json");

module.exports.run = async (client, message, args) => {
	const { id, from } = message;
	const arg = args[1] === undefined ? args[0].join("") : args[1].join("");
	let as;
	if (!arg)
		return await client.reply(
			from,
			`Debes proporcionar un enlace de invitacion, escribe ${prefix}join (enlace de invitacion), recuerda que no es necesario escribir los parentesis.`,
			id,
		);
	const isurl = arg.match(
		/^(https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]{22})$/,
	);
	if (!isurl)
		return await client.reply(
			from,
			`El enlace proporcionado no es una invitacion.`,
			id,
		);
	await client.reply(from, `Gracias por la invitacion.`, id);
	await client.joinGroupViaLink(arg, { returnChatObj: true }).then((a) => {
		as = a;
	});
	setTimeout(() => {
		client.sendText(
			as.id,
			`Gracias por la invitacion
Puedes escribir ${prefix}help para ver los comandos
Para resolver tus dudas sobre el desarrollo del bot, puedes contactarme aqui:
WhatsApp: wa.me/525633592644 
Discord: Cyopn#7302
Instagram: https://instagram.com/Cyopn_`,
		);
	}, 2000);
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `join`,
	alias: `j`,
	type: `misc`,
	description: ``,
	fulldesc: ``,
};
