require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");

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
        const result = await pintarest(arg)
        if (result.status) {
            const url = result.url
            const ext = result.url.split('.').pop(-1)
            if (ext === "mp4") {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        caption: "w",
                        video: { url: url },
                    },
                    { quoted: msg },
                );
            } else if (ext === "jpg" || ext === "jpeg" || ext === "png") {
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
        } else {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `El enlace proporcionado no es válido (deben ser enlaces de tipo https://pin.it/).`,
                },
                { quoted: msg },)
        }
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `pinterest`,
    alias: `pin`,
    type: `ign`,
    description: `Envía contenido de Pinterest.`,
    fulldesc: `Comando para enviar contenido de Pinterest, escribe ${prefix}pinterest (enlace), o su alias ${prefix}pin (enlace), recuerda que no es necesario escribir los parentesis, o también puedes responder a un enlace ya enviado, usando ${prefix}pinterest, o su alias ${prefix}pin respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
