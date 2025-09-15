require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const db = require("megadbx");

module.exports.run = async (sock, msg, args) => {
    try {
        let dbl = new db.MegaDBFull("level", {
            dir: "./"
        });

        let dbg = new db.MegaDBFull("groups", {
            dir: "./"
        });
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
        if (args[0] === undefined) {
            for (u of args[0]) {
                if (Number.isNaN(Number.parseInt(u.replace("@", "")))) return
                mentioned = true;
                lu.push(u);
            }
        }
        const p = mentioned ? lu[0].replace("@", "") : `${msg.key.participantPn.split("@")[0]}`;
        if (await dbl.has(`${gid}.${p}`)) {
            const { xp, level } = await dbl.get(`${gid}.${p}`)
            sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Felicidades @${p}
Nivel: ${level}, Experiencia: ${xp}\n${footer}`,
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
        await dbl.flush()
        await dbl.close()
        await dbg.flush()
        await dbg.close()
    } catch (e) {
        await errorHandler(sock, msg, this.config.name, e);
    }
};

module.exports.config = {
    name: `level`,
    alias: [`l`, `nivel`, `lvl`, `xp`],
    type: `misc`,
    description: `Muestra tu nivel y experiencia conforme tus mensajes enviados.`,
};
