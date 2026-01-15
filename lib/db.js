const db = require("megadbx");

let dba = new db.MegaDB("afk", {
    dir: "./",
    flushInterval: 1000,
});

let dbe = new db.MegaDB("error", {
    dir: "./",
    flushInterval: 1000,
});


let dbg = new db.MegaDB("groups", {
    dir: "./",
    flushInterval: 1000,
});
let dbl = new db.MegaDB("level", {
    dir: "./",
    flushInterval: 1000,
});

const dbs = new db.MegaDB("suggest", {
    dir: "./",
    flushInterval: 1000,
});

/**
 * Sistema de niveles
 * @param {Object} client Cliente/bot
 * @param {Object} message Mensaje recibido
 */
const evalLevel = async (sock, msg, content) => {
    try {
        const { remoteJid, participantPn } = msg.key;
        const gid = remoteJid.split("@")[0];
        const gci = await dbg.get(`${gid}.rank`);
        if (!gci) return;
        const uid =
            participantPn !== undefined
                ? participantPn.split("@")[0]
                : remoteJid.split("@")[0];
        const sxp =
            parseInt(((Math.random() * content.length) / 10).toFixed(0)) + 1;
        if (await dbl.has(gid) && await dbl.has(`${gid}.${uid}`)) {
            let { xp, level } = await dbl.get(`${gid}.${uid}`);
            let lvlup = 5 * level ** 2 + 50 * level + 100;
            if (parseInt(xp) + parseInt(sxp) >= lvlup) {
                let a = await dbl.update(`${gid}.${uid}`, {
                    $set: { xp: 0 },
                    $inc: { level: 1 },
                });
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `Felicidades @${uid} has avanzado de nivel: ${a.level} \n¡Sigue asi!\nUsa _${prefix}rank_ para ver la tabla de clasificacion.`,
                    mentions: [`${uid}@s.whatsapp.net`],
                });
            } else {
                await dbl.update(`${gid}.${uid}`, {
                    $inc: { xp: parseInt(sxp) },
                });
            }
        } else {
            await dbl.set(`${gid}.${uid}`, {
                xp: parseInt(sxp),
                level: 1,
            });
        }
    } catch (e) {
        dbe.set(`eval.${new Date().toLocaleDateString().replaceAll("/", "-")}T${new Date().toLocaleTimeString().replaceAll(":", "-").replaceAll(".", "-")}`, {
            error: e.toString(),
            errorobj: e,
            message: msg,
        });
    }
};

/**
 * Obtiene el estado de un miembro si está en afk
 * @param {String} gid Identificador del grupo
 * @param {String} uid Identificador del usuario
 * @returns Indefinido si no esta en afk, la razon si no es asi
 */
const getAfk = async (gid, uid) => {
    let r = undefined;
    if (dba.has(`${gid}.${uid}`)) {
        const { status, reason } = await dba.get(`${gid}.${uid}`);
        if (status === "afk") {
            r = reason;
        }
    }
    return r;
};

/**
 * Resuelve el estado de un miembro si está en afk
 * @param {String} gid Identificador del grupo
 * @param {String} uid identificador del usuario
 * @returns Verdadero si se ha desactivado el afk, de lo contrario sea falso
 */
const solveAfk = async (gid, uid, sts) => {
    let r = false;
    if (dba.has(`${gid}.${uid}`)) {
        const { status } = await dba.get(`${gid}.${uid}`);
        if (status === "afk") {
            dba.set(`${gid}.${uid}`, {
                status: sts,
                reason: "",
            });
            r = true;
        }
    }
    return r;
};

/**
 * Procesa un mensaje de grupo
 * @param {*} msg Mensaje recibido
 */
const processGroup = async (msg) => {
    const gid = msg.key.remoteJid.split("@")[1] === "g.us" ? msg.key.remoteJid.split("@")[0] : undefined;
    if (gid !== undefined) {
        if (dbg.has(gid)) return;
        await dbg.set(`${gid}.rank`, false);
    }
};

/**
 * Activa o desactiva configuracion de grupo
 * @param {String} db Base de datos
 * @param {String} gid Identificador del grupo
 * @returns El estado de la configuracion
 */
const setConfig = async (db, gid) => {
    const enable = await dbg.get(`${gid}.${db}`);
    await dbg.set(`${gid}.rank`, !enable);
    return enable;
};

/**
 * Obtiene la configuracion de un grupo
 * @param {String} db Base de datos
 * @param {String} gid Identificador del grupo
 * @returns El estado de la configuracion
 */
const getConfig = async (db, gid) => {
    const enable = await dbg.get(`${gid}.${db}`);
    return enable;
};

/**
 * Obtiene la experiencia y nivel de un miembro en un grupo
 * @param {String} gid 
 * @param {String} participant 
 * @returns { has: Boolean, xp: Number, level: Number }
 */
const getXpLevel = async (gid, participant) => {
    let result = { has: false, xp: 0, level: 0 };
    result.has = await dbl.has(`${gid}.${participant}`);
    if (result.has) {
        const { xp, level } = await dbl.get(`${gid}.${participant}`);
        result.xp = xp;
        result.level = level;
    }
    return result;
};

const getRank = async (gid) => {
    let result = { has: false, mentions: [], text: "" };
    const has = await dbl.has(`${gid}`);
    result.has = has;
    let dbObj = {};
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
        let i = 0;
        dbArray.forEach((k) => {
            i += 1;
            if (i <= 10) {
                result.text += `${i}-. @${k.id} ~ Nivel: ${k.level} ~ Experiencia: ${k.xp} \n`;
                result.mentions.push(`${k.id}@s.whatsapp.net`);
            }
        });
    }
    return result;
};

const saveSuggest = async (gid, uid, suggestion, quoted) => {
    const date = new Date();
    await dbs.set(
        `${gid}.${uid}-${date.getDate()}/${date.getUTCMonth() + 1
        }-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
        {
            suggest: suggestion,
            suggestQuoted:
                quoted !== undefined
                    ? quoted
                    : "No hay mensaje citado",
        }
    );
};


module.exports = {
    evalLevel,
    getAfk,
    solveAfk,
    processGroup,
    setConfig,
    getConfig,
    getXpLevel,
    getRank,
    saveSuggest
};