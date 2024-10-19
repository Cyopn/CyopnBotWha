require("dotenv").config();
const { prefix } = process.env;
const axios = require("axios").default;
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
        const response = await axios.request({
            method: 'POST',
            url: 'https://pinterest-downloader-download-pinterest-image-video-and-reels.p.rapidapi.com/api/server',
            headers: {
                'x-rapidapi-key': '38211cd4dcmsh34d9a30b672d1bfp1b3e3cjsna306af72a23a',
                'x-rapidapi-host': 'pinterest-downloader-download-pinterest-image-video-and-reels.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            data: {
                id: arg
            }
        });
        const data = response.data;
        if (data.status === 400 || data.data === undefined) return await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: "No se encontro el contenido.",
            },
            { quoted: msg },
        );
        if (data.data.videos !== null) return await sock.sendMessage(
            msg.key.remoteJid,
            { video: { url: data.data.videos.V_720P.url }, caption: "w" },
            { quoted: msg },
        );
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                caption: "w",
                image: { url: data.data.images.orig.url },
            },
            { quoted: msg },
        );
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `pinterest`,
    alias: `pin`,
    type: `misc`,
    description: `Envía contenido de Pinterest.`,
    fulldesc: `Comando para enviar contenido de Pinterest, escribe ${prefix}pinterest (enlace), o su alias ${prefix}pin (enlace), recuerda que no es necesario escribir los parentesis, o también puedes responder a un enlace ya enviado, usando ${prefix}pinterest, o su alias ${prefix}pin respondiendo al enlace. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
