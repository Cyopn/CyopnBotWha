require("dotenv").config();
const { prefix } = process.env;
const { tiktok } = require("../lib/scrapper");
const { errorHandler } = require("../lib/functions");

module.exports.run = async (sock, msg, args) => {
    const arg =
        args[1] === undefined && args[0].join("").length >= 1
            ? args[0].join("")
            : args[1] === undefined
                ? ""
                : args[1].join("");
    if (!arg)
        return sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `Debes proporcionar un enlace. Escribe ${prefix}tiktok (enlace). No es necesario escribir los paréntesis.`,
            },
            { quoted: msg },
        );
    try {
        const res = await tiktok(arg);
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                audio: { url: res.data.audio },
                mimetype: "audio/mpeg",
            },
            { quoted: msg },
        );
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `tkaudio`,
    alias: [`tka`],
    type: `misc`,
    description: `Envía el audio de TikTok.`,
};
