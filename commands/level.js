const { prefix } = require("../config.json");
const db = require("megadb");
const dbl = new db.crearDB({
	nombre: "dataLevel",
	carpeta: "./database",
});
let dbs = new db.crearDB({
	nombre: "dataDesc",
	carpeta: "./database",
});

module.exports.run = async (client, message, args) => {
	const { id, from, author, isGroupMsg, body, quotedMsg, mentionedJidList } =
		message;
	if (!isGroupMsg)
		return await client.reply(
			from,
			`Comando solo disponible en grupos.`,
			id
		);
	const groupId = isGroupMsg ? from.replace("@g.us", "") : "";
	const userId = quotedMsg
	? quotedMsg.author.replace("@c.us", "")
	: mentionedJidList && mentionedJidList[0]
	? mentionedJidList[0].replace("@c.us", "")
	: author.replace("@c.us", "");
	const { level } = await dbs.get(groupId);
	if (!level)
		return await client.reply(
			from,
			`Para usar este comando primero debes activar el sistema de niveles. \n_Escribe ${prefix}act level_ para activarlo. \nUsa _${prefix}help level_ si existe alguna duda sobre este comando.`,
			id
		);
	const sxp = parseInt(((Math.random() * body.length) / 10).toFixed(0)) + 1;
	if (!dbl.has(`${groupId}.${userId}`)) {
		dbl.set(`${groupId}.${userId}`, { xp: sxp, level: 1 });
	}
	const r = await dbl.get(`${groupId}.${userId}`);
	const lvlup = 5 * r.level ** 2 + 50 * r.level + 100;
	await client.sendReplyWithMentions(
		from,
		`¡Buen trabajo @${userId.concat("@c.us")}!
*Experiencia: ${r.xp}*
*Nivel: ${r.level}*
_Necesitas ${lvlup - r.xp} puntos de experiencia mas para subir de nivel_`,
		id
	);
	await client.simulateTyping(from, false);
};

module.exports.config = {
	name: `level`,
	alias: `lvl`,
	type: `misc`,
	description: `Conoce tu progreso segun tu actividad (o de otro participante) en el grupo, conforme a la cantidad de palabras y mensajes enviados.`,
	fulldesc: `Usa este comando para conocer el progreso (nivel y experiencia), ya sea el tuyo o algun otro participante al mencionarlo: _${prefix}level @nose_, segun la cantidad de palabras en un mensaje enviado, se excluiran los siguientes casos: \nStickers \nImagenes/videos \nAudios. \n Comando solo disponible en grupos.`,
};
