require("dotenv").config();
const { prefix, owner } = process.env;
const { errorHandler } = require("../lib/functions");
const { ytmp3, cleanTemp } = require("../lib/scrapper");
const fs = require("fs");
const path = require("path");

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
                    text: `Debes proporcionar un enlace. Escribe ${prefix}ytmp3 (enlace). No es necesario escribir los paréntesis.`,
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
            { text: `Descargando audio, por favor espera...` },
            { quoted: msg },
        );
        const res = await ytmp3(arg);
        const fileName = path.basename(res.filePath);
        const port = process.env.port || 3000;
        const baseUrl = process.env.APP_URL || `http://localhost:${port}`;
        const downloadLink = `${baseUrl}/temp/${fileName}`;
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `*${res.title}*\nDescarga completada. Tu audio está disponible por 1 hora:\n${downloadLink}`
            },
            { quoted: msg }
        );
        await cleanTemp(res.filePath, 3600000);
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `ytmp3`,
    alias: [`ytmp3`],
    type: `misc`,
    description: `Envía el audio de un video de YouTube en formato MP3. El comando puede tardar un poco dependiendo de la duración del video.`,
};