require("dotenv").config();
const { prefix, owner } = process.env;
const { errorHandler } = require("../lib/functions");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const ffmpeg = require("ffmpeg")

module.exports.run = async (sock, msg, args) => {
    try {
        const type =
            msg.message.imageMessage ||
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                    ?.imageMessage ||
                msg.message?.viewOnceMessage?.message?.imageMessage ||
                msg.message?.viewOnceMessageV2?.message?.imageMessage ||
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                    ?.viewOnceMessage?.message?.imageMessage ||
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                    ?.viewOnceMessageV2?.message?.imageMessage
                ? "image"
                : msg.message?.videoMessage ||
                    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                        ?.videoMessage ||
                    msg.message?.viewOnceMessage?.message?.videoMessage ||
                    msg.message?.viewOnceMessageV2?.message?.videoMessage ||
                    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                        ?.viewOnceMessage?.message?.videoMessage ||
                    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                        ?.viewOnceMessageV2?.message?.videoMessage
                    ? "video"
                    : undefined;
        const m = msg.message?.imageMessage
            ? msg.message?.imageMessage
            : msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                ?.imageMessage
                ? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                    ?.imageMessage
                : msg.message?.videoMessage
                    ? msg.message?.videoMessage
                    : msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                        ?.videoMessage
                        ? msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                            ?.videoMessage
                        : undefined;
        if (m === undefined || m === null || type === undefined || type === null || type == "image") return await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `Envia una video con el comando *${prefix}toaudio*, o bien, responde a alguno ya enviado.`,
            },
            { quoted: msg },
        );
        let w = await downloadContentFromMessage(m, type)
        w.pipe(fs.createWriteStream(`./temp/video.mp4`)).once("finish", () => {
            var process = new ffmpeg(`./temp/video.mp4`);
            process.then(function (video) {
                video.fnExtractSoundToMP3(`./temp/video.mp3`, async function (error, file) {
                    if (error) return await errorHandler(sock, msg, "toaudio", error);
                    await sock.sendMessage(
                        msg.key.remoteJid,
                        {
                            audio: fs.readFileSync("./temp/video.mp3"),
                            mimetype: "audio/mpeg",
                        },
                        { quoted: msg },
                    );
                    while (fs.existsSync(`./temp/video.mp4`)) {
                        fs.unlinkSync(`./temp/video.mp4`);
                    }
                    while (fs.existsSync(`./temp/video.mp3`)) {
                        fs.unlinkSync(`./temp/video.mp3`);
                    }
                });
            }, async function (err) {
                await errorHandler(sock, msg, "toaudio", err);
            });
        })
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `toaudio`,
    alias: `ta`,
    type: `misc`,
    description: `Convierte un video a audio mp3.`,
};
