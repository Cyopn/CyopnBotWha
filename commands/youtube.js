require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { withYoutubeCookieFallback } = require("../lib/youtube");
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
        let isHttpUrl = false;
        try {
            const url = new URL(arg);
            isHttpUrl = (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
        } catch (e) {
            isHttpUrl = false;
        }
        if (!isHttpUrl)
            return await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `El enlace no es válido.`,
                },
                { quoted: msg },
            );
        await sock.sendMessage(
            msg.key.remoteJid,
            { text: `Obteniendo información de formatos, por favor espera...` },
            { quoted: msg },
        );
        const ytdlp = new YtDlp();
        const info = await withYoutubeCookieFallback((cookieOptions) =>
            ytdlp.getInfoAsync(arg, cookieOptions)
        );
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
                title: info.title || 'Video',
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
                text: `*${info.title || 'Video'}*\n\nSelecciona un formato para descargar:\n${formatLink}\n\nNota: El enlace estará disponible por 1 hora.`
            },
            { quoted: msg }
        );

        setTimeout(() => {
            fs.unlink(formatFilePath, e => {

            });
        }, 3600000);

    } catch (e) {
        await errorHandler(sock, msg, module.exports.config.name, e);
    }
};

module.exports.config = {
    name: `youtube`,
    alias: [`yt`],
    type: `misc`,
    description: `Obtiene los formatos disponibles para enlaces compatibles con yt-dlp y proporciona un enlace para seleccionar y descargar.`,
};