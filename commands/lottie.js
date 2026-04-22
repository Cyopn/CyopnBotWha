require("dotenv").config();
const { prefix, owner } = process.env;
const fs = require("fs");
const path = require("path");
const { sticker, errorHandler, buildLottieSticker } = require("../lib/functions");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports.run = async (sock, msg, args) => {
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
    if (m === undefined || m === null || type === undefined || type === null || type === "video") {
        sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `Envía una imagen con el comando *${prefix}lottie*, o bien responde a uno ya enviado.`,
            },
            { quoted: msg },
        );
    } else {
        try {
            const w = await downloadContentFromMessage(m, type).catch(async (e) => {
                await errorHandler(sock, msg, "sticker", e);
            });
            let buffer = Buffer.from([]);
            for await (const chunk of w) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            const res = await buildLottieSticker(buffer);
            await sock
                .sendMessage(msg.key.remoteJid, { sticker: fs.readFileSync(res), mimetype: "application/was", isLottie: true, isAnimated: true }, { quoted: msg })
                .catch(async (e) => {
                    await errorHandler(sock, msg, this.config.name, e);
                });
            fs.unlinkSync(res);
        } catch (e) {
            await errorHandler(sock, msg, this.config.name, e);
        }
    }
};

module.exports.config = {
    name: `lottie`,
    alias: `lt`,
    type: `misc`,
    description: `Convierte una imagen en un sticker Lottie animado. El comando solo acepta imágenes, no videos o gifs. Para usarlo, envía una imagen con el comando *${prefix}lottie* o responde a una imagen ya enviada con el comando.`,
};
