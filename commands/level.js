require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const { getConfig, getXpLevel } = require("../lib/db")

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
        const footer = enable ? "" : "El sistema de niveles esta desactivado."
        let lu = [];
        let mentioned = false;
        if (args[0] !== undefined) {
            for (u of args[0]) {
                u = (await sock.groupMetadata(msg.key.remoteJid)).participants.filter(e => {
                    return e.jid ? e.lid.includes(u.replace("@", "")) : null
                })[0].jid;
                console.log(u)
                if (Number.isNaN(Number.parseInt(u.replace("@", "")))) return
                mentioned = true;
                lu.push(u);
            }
        }
        const p = mentioned ? lu[0].replace("@", "") : `${msg.key.participantPn.split("@")[0]}`;
        const { has, xp, level } = await getXpLevel(gid, p);
        if (!has) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `${mentioned ? `El miembro @${lu[0].replace(
                        "@s.whatsapp.net",
                        "",
                    )} no tiene` : "No tienes"} nivel ni experiencia aún. \n${footer}`,
                    mentions: mentioned ? [lu[0]] : []
                },
                { quoted: msg },
            );
        } else {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `${mentioned ? `El miembro @${lu[0].replace(
                        "@s.whatsapp.net",
                        "",
                    )} tiene` : "Tienes:"} \nNivel: *${level}*\nExperiencia: *${xp}*\n${footer}`,
                    mentions: mentioned ? [lu[0]] : []
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
};
