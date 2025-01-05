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
    try {
        const res = await tiktok(arg, "audio")
        if (res.length > 0) {
            res.forEach(async (media) => {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        audio: { url: media.url },
                        mimetype: "audio/mpeg",
                    },
                    { quoted: msg },
                );
            })
        } else {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "No se encontraron videos o imagenes en el enlace proporcionado.",
                },
                { quoted: msg },
            );
        }
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `tkaudio`,
    alias: `tka`,
    type: `misc`,
    description: `Envia el audio de tiktok .`,
    fulldesc: `Comando para descargar el audio de Tiktok, escribe ${prefix}tkaudio (enlace), o con su alias ${prefix}tka (enlace), recuerda que no es necesario escribir los parentesis, tambien puedes responder a un enlace ya enviado, usando ${prefix}tkaudio, o su alias ${prefix}tka respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
