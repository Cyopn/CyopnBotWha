require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const { getConfig, getXpLevel } = require("../lib/db");

module.exports.run = async (sock, msg, args) => {
    try {
        if (!msg.key.remoteJid.includes("g.us"))
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Comando solo disponible en grupos.`,
                },
                { quoted: msg },
            );
        const gid = msg.key.remoteJid.split("@")[0];
        const enable = await getConfig("rank", gid);
        const footer = enable ? "" : "El sistema de niveles esta desactivado.";
        let lu = [];
        let mentioned = false;
        if (args[0][0] && args[0][0].length > 1) {
            for (u of args[0]) {
                const user = u.replace("@", "").toString();
                (await sock.groupMetadata(msg.key.remoteJid)).participants.forEach(e => {
                    if (!user.includes(e.id.split("@")[0])) return
                    lu = [e.id.split("@")[0], e.phoneNumber];
                    mentioned = true;
                });
            }
        }
        const p = mentioned ? lu[0] : `${msg.key.participant.split("@")[0]}`;
        const { has, xp, level } = await getXpLevel(gid, p);
        if (!has) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `${mentioned ? `El miembro @${lu[1].replace(
                        "@s.whatsapp.net",
                        "",
                    )} no tiene` : "No tienes"} nivel ni experiencia aún. \n${footer}`,
                    mentions: mentioned ? [lu[1]] : []
                },
                { quoted: msg },
            );
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `${mentioned ? `El miembro @${lu[1].replace(
                        "@s.whatsapp.net",
                        "",
                    )} tiene` : "Tienes:"} \nNivel: *${level}*\nExperiencia: *${xp}*\n${footer}`,
                    mentions: mentioned ? [lu[1]] : []
                },
                { quoted: msg },
            );
        }
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `level`,
    alias: [`l`, `nivel`, `lvl`, `xp`],
    type: `misc`,
    description: `Muestra tu nivel y experiencia conforme tus mensajes enviados.`,
    expects: ['none', 'mention'],
    returns: ['text']
};
