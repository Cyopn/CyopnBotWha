require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { pinterest } = require("../lib/scrapper")

module.exports.run = async (sock, msg, args) => {
    const arg =
        args[1] === undefined && args[0].join("").length >= 1
            ? args[0].join("")
            : args[1] === undefined
                ? ""
                : args[1].join("");
    if (!arg) return sock.sendMessage(
        msg.key.remoteJid,
        {
            text: `Debes proporcionar un enlace, escribe ${prefix}pinterest (enlace), recuerda que no es necesario escribir los parentesis.`,
        },
        { quoted: msg },
    );
    try {
        await pinterest(arg).then(async (url) => {
            const ext = url.split('.').pop(-1)
            if (ext === "mp4") {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        caption: "w",
                        video: { url: url },
                    },
                    { quoted: msg },
                );
            } else if (ext === "jpg") {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        caption: "w",
                        image: { url: url },
                    },
                    { quoted: msg },
                );
            } else if (ext === "gif") {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text: `Enlace de descarga: ${url}`
                    },
                    { quoted: msg },
                );
            }
        }).catch(async (e) => {
            await errorHandler(sock, msg, "pinterest", e);
        })

    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `pinterest`,
    alias: [`pin`],
    type: `ign`,
    description: `Envía contenido de Pinterest.`,
};
