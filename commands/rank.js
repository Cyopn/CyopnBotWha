require("dotenv").config();
const { errorHandler } = require("../lib/functions");
const db = require("megadbx");

module.exports.run = async (sock, msg, args) => {
    const { remoteJid } = msg.key;
    try {
        let dbl = new db.MegaDBFull("level", {
            dir: "./"
        });

        let dbg = new db.MegaDBFull("groups", {
            dir: "./"
        });
        if (!remoteJid.includes("g.us"))
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Comando solo disponible en grupos.`,
                },
                { quoted: msg },
            );
        let dbObj = {};
        const gid = remoteJid.split("@")[0];
        const enable = await dbg.get(`${gid}.rank`);
        const has = await dbl.get(`${gid}`)
        const name = (await sock.groupMetadata(remoteJid)).subject;
        if (has) {
            let keys = await dbl.keys(`${gid}`);
            for (let i in keys) {
                let val = await dbl.get(`${gid}.${keys[i]}`);
                dbObj[keys[i]] = val;
            }
            let dbArray = [];
            for (let x in dbObj) {
                dbArray.push({
                    id: x,
                    xp: dbObj[x].xp,
                    level: dbObj[x].level,
                });
            }
            dbArray.sort(function (a, b) {
                if (a.level > b.level) {
                    return -1;
                } else if (a.level < b.level) {
                    return 1;
                } else {
                    if (a.xp > b.xp) {
                        return -1;
                    } else if (a.xp < b.xp) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            });
            let text = "";
            let i = 0;
            let mentions = [];
            dbArray.forEach((k) => {
                i += 1;
                if (i <= 10) {
                    text += `${i}-. @${k.id} ~ Nivel: ${k.level} ~ Experiencia: ${k.xp} \n`;
                    mentions.push(`${k.id}@s.whatsapp.net`);
                }
            });
            const footer = enable ? "" : "El sistema de niveles esta desactivado."
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Tabla de clasificacion en *${name}* \n${text}${footer}`,
                    mentions: mentions,
                },
                { quoted: msg },
            );
        } else {
            const footer = enable ? "" : "El sistema de niveles esta desactivado."
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `Aun no se tienen suficientes datos.\n${footer}`,
                },
                { quoted: msg },
            );
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
    name: `rank`,
    alias: [`r`],
    type: `misc`,
    description: `Muestra el top 10 de los miembros con mas niveles y experioencia.`,
};
