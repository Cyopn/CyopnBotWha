require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const { setConfig, getConfigValue, setConfigValue } = require("../lib/db");

module.exports.run = async (sock, msg, args) => {
    const { remoteJid } = msg.key;
    const cid = remoteJid.split("@")[0];
    try {
        if (remoteJid.includes("g.us")) {
            const isAdmin = (
                await sock.groupMetadata(remoteJid)
            ).participants.some(
                (e) => e.id === msg.key.participant && e.admin !== null,
            );
            if (!isAdmin)
                return sock.sendMessage(
                    remoteJid,
                    {
                        text: `Debes ser administrador para usar este comando.`,
                    },
                    { quoted: msg },
                );
        }

        const argv = Array.isArray(args?.[0])
            ? args[0].map((x) => String(x).trim().toLowerCase()).filter(Boolean)
            : [];

        let hasChangedInterval = false;
        let parsedEvery = undefined;

        const numericArg = argv.find((token) => /^\d+$/.test(token));
        if (numericArg !== undefined) {
            parsedEvery = Math.max(1, Number.parseInt(numericArg));
            hasChangedInterval = true;
        }

        const hasEveryFlag = argv.includes("--cada") || argv.includes("-c") || argv.includes("cada");
        if (!hasChangedInterval && hasEveryFlag) {
            const pos = argv.findIndex((token) => token === "--cada" || token === "-c" || token === "cada");
            const next = argv[pos + 1];
            if (next && /^\d+$/.test(next)) {
                parsedEvery = Math.max(1, Number.parseInt(next));
                hasChangedInterval = true;
            }
        }

        if (hasChangedInterval) {
            await setConfigValue("ollamaEvery", cid, parsedEvery);
            await setConfigValue("ollamaCounter", cid, 0);
        }

        let enabled = false;
        if (argv.includes("on") || argv.includes("activar") || argv.includes("enable")) {
            await setConfigValue("ollamaAuto", cid, true);
            enabled = false;
        } else if (argv.includes("off") || argv.includes("desactivar") || argv.includes("disable")) {
            await setConfigValue("ollamaAuto", cid, false);
            enabled = true;
        } else {
            enabled = await setConfig("ollamaAuto", cid);
        }

        const currentEvery = Number(await getConfigValue("ollamaEvery", cid, 50)) || 50;
        await sock.sendMessage(
            remoteJid,
            {
                text: `${enabled
                    ? `A partir de ahora, las respuestas automaticas con Ollama estan desactivadas.`
                    : `A partir de ahora, las respuestas automaticas con Ollama estan activadas.`}
Frecuencia actual: cada ${currentEvery} mensajes.
Uso: !edollama [on|off] [--cada N]`,
            },
            { quoted: msg },
        );
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `edollama`,
    alias: ["edo", "autobot", "edai"],
    type: `misc`,
    description: `Activa/desactiva las respuestas automaticas de Ollama por chat.`,
	expects: ['none'],
	returns: ['text']
};
