require("dotenv").config();
const { prefix, py_cmd } = process.env;
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { writeFile, unlink } = require("fs/promises");
const { errorHandler } = require("../lib/functions");
const { exec } = require("child_process");

module.exports.run = async (sock, msg, args) => {
    const s =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ?.stickerMessage;
    if (s === undefined || s === null)
        return sock.sendMessage(
            msg.key.remoteJid,
            {
                text: `Usa ${prefix}toimg respondiendo un sticker.`,
            },
            { quoted: msg },
        );
    try {
        const w = await downloadContentFromMessage(s, "sticker");
        let buffer = Buffer.from([]);
        for await (const chunk of w) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        await writeFile("./temp/w.webp", buffer);
        exec(`${py_cmd_img}`, async (error, stdout, stderr) => {
            if (error) {
                await errorHandler(sock, msg, this.config.name, error);
                return;
            }
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    caption: "w",
                    image: { url: "./temp/w.png" },
                },
                { quoted: msg },
            );
            await unlink("./temp/w.png");
            await unlink("./temp/w.webp");
        });
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: "toimg",
    alias: [`ti`],
    type: `misc`,
    description: "Convierte a imagen un sticker ya enviado, respondiendo a el.",
};
