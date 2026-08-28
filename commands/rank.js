require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const { getConfig, getRank } = require("../lib/db");

module.exports.run = async (sock, msg, args) => {
    const { remoteJid } = msg.key;
    try {
        if (!remoteJid.includes("g.us"))
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Comando solo disponible en grupos.`,
                },
                { quoted: msg },
            );
        const gid = remoteJid.split("@")[0];
        const enable = getConfig("rank", gid);
        const name = (await sock.groupMetadata(remoteJid)).subject;
        const { has, dict } = await getRank(gid);
        console.log(dict);
        const footer = enable ? "" : "El sistema de niveles esta desactivado.";
        if (!has) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `No hay datos suficientes para mostrar la tabla de clasificación.\n${footer}`,
                },
                { quoted: msg },
            );
        } else {
            const participants = await sock.groupMetadata(msg.key.remoteJid);
            let i = 0;
            let text = "";
            let mentions = [];
            dict.forEach((k) => {
                i += 1;
                if (i <= 10) {
                    const p = participants.participants.find(p => p.id.split("@")[0] === k.id);
                    if (p) {
                        text += `${i}-. @${p.phoneNumber.split("@")[0]} ~ Nivel: ${k.level} ~ Experiencia: ${k.xp} \n`;
                        mentions.push(p.phoneNumber);
                    }
                }
            });
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Tabla de clasificación en *${name}* \n${text}`,
                    mentions: mentions,
                },
                { quoted: msg },
            );
        }

    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `rank`,
    alias: [`r`],
    type: `misc`,
    description: `Muestra el top 10 de los miembros con mas niveles y experiencia.`,
    expects: ['none'],
    returns: ['text']
};
