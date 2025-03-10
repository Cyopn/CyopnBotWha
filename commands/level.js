require("dotenv").config();
const { prefix, owner } = process.env;
const { errorHandler } = require("../lib/functions");
const db = require("megadb");

let dbl = new db.crearDB({
    nombre: "level",
    carpeta: "./database",
});

let dbg = new db.crearDB({
    nombre: "groups",
    carpeta: "./database",
});

module.exports.run = async (sock, msg, args) => {
    try {
        if (!msg.key.remoteJid.includes("g.us"))
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Comando solo disponible en grupos.`,
                },
                { quoted: msg },
            );
        const gid = msg.key.remoteJid.split("@")[0];
        const enable = await dbg.get(`${gid}.rank`);
        const footer = enable ? "" : "El sistema de niveles esta desactivado."
        let lu = [];
        let mentioned = false;
        for (u of args[0]) {
            if (Number.isNaN(Number.parseInt(u.replace("@", "")))) return
            mentioned = true;
            lu.push(u);
        }
        const p = mentioned ? lu[0].replace("@", "") : `${msg.key.participant.split("@")[0]}`;
        if (await dbl.has(`${gid}.${p}`)) {
            const { xp, level } = await dbl.get(`${gid}.${p}`)
            sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Felicidades @${p}
Nilvel: ${level}, Experiencia: ${xp}\n${footer}`,
                    mentions: [p.replace("@", "").concat("@s.whatsapp.net")],
                },
                { quoted: msg },
            );
        } else {
            sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `El miembro aun no envia suficientes mensajes.\n${footer}`,
                },
                { quoted: msg },
            )
        }
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `level`,
    alias: [`l`, `nivel`],
    type: `misc`,
    description: `Muestra tu nivel y experiencia conforme tus mensajes enviados.`,
};
