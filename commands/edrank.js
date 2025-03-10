require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const db = require("megadb");
let dbg = new db.crearDB({
    nombre: "groups",
    carpeta: "./database",
});

module.exports.run = async (sock, msg, args) => {
    const { remoteJid } = msg.key;
    const gid = remoteJid.split("@")[0];
    try {
        if (!msg.key.remoteJid.includes("g.us"))
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Comando solo disponible en grupos.`,
                },
                { quoted: msg },
            );
        const isAdmin = (
            await sock.groupMetadata(msg.key.remoteJid)
        ).participants.some(
            (e) => e.id === msg.key.participant && e.admin !== null,
        );
        if (!isAdmin)
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Debes ser administrador para usar este comando.`,
                },
                { quoted: msg },
            );
        const enable = await dbg.get(`${gid}.rank`);
        await dbg.set(`${gid}.rank`, !enable)
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: enable
                    ? `A partir de ahora, el sistema de niveles esta desactivado.`
                    : `A partir de ahora, el sistema de niveles esta activado.`,
            },
            { quoted: msg },
        );
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `edrank`,
    alias: [`er`],
    type: `misc`,
    description: `Activa/desactiva el sistema de niveles.`,
};
