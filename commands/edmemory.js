require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const { setConfig } = require("../lib/db");

module.exports.run = async (sock, msg) => {
    const { remoteJid } = msg.key;
    const cid = remoteJid.split("@")[0];
    try {
        if (remoteJid.includes("g.us")) {
            const isAdmin = (
                await sock.groupMetadata(remoteJid)
            ).participants.some(
                (e) => e.id === msg.key.participant && e.admin !== null,
            );
            if (!isAdmin)
                return sock.sendMessage(
                    remoteJid,
                    {
                        text: `Debes ser administrador para usar este comando.`,
                    },
                    { quoted: msg },
                );
        }

        const enabled = await setConfig("chatMemory", cid);
        await sock.sendMessage(
            remoteJid,
            {
                text: enabled
                    ? `A partir de ahora, el guardado de conversación esta desactivado.`
                    : `A partir de ahora, el guardado de conversación esta activado.`,
            },
            { quoted: msg },
        );
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `edmemory`,
    alias: [`edm`, `memchat`, `storechat`],
    type: `misc`,
    description: `Activa/desactiva el guardado de conversación por chat.`,
	expects: ['none'],
	returns: ['text']
};
