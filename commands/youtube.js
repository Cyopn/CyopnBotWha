require("dotenv").config();
const { prefix, owner } = process.env;
const { errorHandler } = require("../lib/functions");
const { YtDlp } = require("ytdlp-nodejs");
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
                    text: `Debes proporcionar un enlace. Escribe ${prefix}yt (enlace). No es necesario escribir los paréntesis.`,
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
            { text: `Obteniendo información de formatos, por favor espera...` },
            { quoted: msg },
        );
        const ytdlp = new YtDlp();
        const info = await ytdlp.getInfoAsync(arg);
        if (!info || !info.formats || info.formats.length === 0) {
            return await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `No se pudieron obtener los formatos disponibles para este video.`,
                },
                { quoted: msg },
            );
        }
        const tempname = `yt_formats_${Date.now()}`;
        const tempDir = './temp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const formatFilePath = path.join(tempDir, `${tempname}.json`);
        const formatData = {
            _metadata: {
                url: arg,
                title: info.title || 'Video de YouTube',
                thumbnail: info.thumbnail || ''
            },
            formats: info.formats
        };
        fs.writeFileSync(formatFilePath, JSON.stringify(formatData, null, 2));

        const port = process.env.port || 3000;
        const baseUrl = process.env.APP_URL || `http://localhost:${port}`;
        const formatLink = `${baseUrl}/yt/formats/${tempname}.json`;

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `*${info.title || 'Video de YouTube'}*\n\nSelecciona un formato para descargar:\n${formatLink}\n\nNota: El enlace estará disponible por 1 hora.`
            },
            { quoted: msg }
        );

        setTimeout(() => {
            fs.unlink(formatFilePath, e => {
                if (e) console.error("Error cleaning up format file:", e);
            });
        }, 3600000);

    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `youtube`,
    alias: [`yt`],
    type: `misc`,
    description: `Obtiene los formatos disponibles para un video de YouTube y proporciona un enlace para seleccionar y descargar.`,
};