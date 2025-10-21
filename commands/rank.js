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
        const { has, mentions, text } = await getRank(gid);
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
    description: `Muestra el top 10 de los miembros con mas niveles y experioencia.`,
};
