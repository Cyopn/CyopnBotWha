require("dotenv").config();
const { prefix, owner } = process.env;
const { fstat } = require("fs");
const { errorHandler } = require("../lib/functions");
const { ytmp4, cleanTemp } = require("../lib/scrapper");
const fs = require("fs");

module.exports.run = async (sock, msg, args) => {
    const arg =
        args[1] === undefined && args[0].join(" ").length >= 1
            ? args[0].join(" ")
            : args[1] === undefined
                ? ""
                : args[1].join(" ");
    try {
        if (!arg)
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Debes proporcionar un enlace. Escribe ${prefix}ytmp4 (enlace). No es necesario escribir los paréntesis.`,
                },
                { quoted: msg },
            );
        const isurl = arg.match(/(www.youtube.com|youtu.be)/g);
        if (!isurl)
            return await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `El enlace proporcionado no es válido.`,
                },
                { quoted: msg },
            );
        await sock.sendMessage(
            msg.key.remoteJid,
            { text: `Descargando vídeo, por favor espera...` },
            { quoted: msg },
        );
        const res = await ytmp4(arg);
        await sock.sendMessage(
            msg.key.remoteJid,
            { video: fs.readFileSync(res.filePath), caption: `*${res.title}* - w` },
        );
        await cleanTemp(res.filePath);
        await cleanTemp(res.filePath.replace(".mp4", ".mkv"));
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `ytmp4`,
    alias: [`mp4`],
    type: `misc`,
    description: `Envía un vídeo de YouTube en formato MP4. El comando puede tardar un poco dependiendo de la duración del vídeo.`,
};
