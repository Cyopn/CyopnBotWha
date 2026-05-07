const { JsonDB } = require("./json_db");

let dba = new JsonDB("afk", {
    dir: "./",
    flushInterval: 200,
});

let dbe = new JsonDB("error", {
    dir: "./",
    flushInterval: 200,
});


let dbg = new JsonDB("groups", {
    dir: "./",
    flushInterval: 200,
});
let dbl = new JsonDB("level", {
    dir: "./",
    flushInterval: 200,
});

const dbs = new JsonDB("suggest", {
    dir: "./",
    flushInterval: 200,
});

const dbc = new JsonDB("chat_memory", {
    dir: "./",
    flushInterval: 200,
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
        await dbg.set(`${gid}.chatMemory`, false);
        await dbg.set(`${gid}.ollamaAuto`, false);
        await dbg.set(`${gid}.ollamaEvery`, 50);
        await dbg.set(`${gid}.ollamaCounter`, 0);
    }
};

/**
 * Activa o desactiva configuracion de grupo
 * @param {String} db Base de datos
 * @param {String} gid Identificador del grupo
 * @returns El estado de la configuracion
 */
const setConfig = async (db, gid) => {
    const enable = Boolean(await dbg.get(`${gid}.${db}`));
    await dbg.set(`${gid}.${db}`, !enable);
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
    return Boolean(enable);
};

/**
 * Establece un valor de configuración por chat.
 * @param {String} db Clave de configuración
 * @param {String} gid Identificador del chat
 * @param {*} value Valor a establecer
 * @returns {*} Valor establecido
 */
const setConfigValue = async (db, gid, value) => {
    await dbg.set(`${gid}.${db}`, value);
    return value;
};

/**
 * Obtiene un valor de configuración por chat.
 * @param {String} db Clave de configuración
 * @param {String} gid Identificador del chat
 * @param {*} defaultValue Valor por defecto si no existe
 * @returns {*} Valor obtenido
 */
const getConfigValue = async (db, gid, defaultValue = undefined) => {
    const has = await dbg.has(`${gid}.${db}`);
    if (!has) return defaultValue;
    return await dbg.get(`${gid}.${db}`);
};

/**
 * Guarda una entrada de conversación por chat.
 * @param {String} chatId Identificador del grupo o chat
 * @param {"user"|"assistant"|"system"} role Rol del mensaje
 * @param {String} senderId Identificador del remitente
 * @param {String} content Contenido del mensaje
 * @param {Object} metadata Metadatos opcionales
 * @returns {Boolean} Verdadero cuando se guarda en la base de datos
 */
const saveConversation = async (chatId, role, senderId, content, metadata = {}) => {
    const text = typeof content === "string" ? content.trim() : "";
    if (!text.length) return false;
    const enabled = await getConfig("chatMemory", chatId);
    if (!enabled) return false;
    const date = new Date();
    await dbc.set(`${chatId}.${date.getTime()}-${Math.floor(Math.random() * 100000)}`, {
        role,
        senderId,
        content: text,
        date: date.toISOString(),
        metadata,
    });
    return true;
};

/**
 * Obtiene historial de conversación por chat.
 * @param {String} chatId Identificador del grupo o chat
 * @param {Number} limit Cantidad máxima de mensajes
 * @returns {Array<{ role: String, senderId: String, content: String, date: String, metadata: Object }>} Historial
 */
const getConversationHistory = async (chatId, limit = 20) => {
    const hasChatHistory = await dbc.has(chatId);
    if (!hasChatHistory) return [];
    const keys = await dbc.keys(chatId);
    if (!Array.isArray(keys) || keys.length === 0) return [];

    keys.sort((a, b) => {
        const ta = Number(String(a).split("-")[0]);
        const tb = Number(String(b).split("-")[0]);
        return ta - tb;
    });

    const selected = keys.slice(-Math.max(1, Number(limit) || 20));
    const history = [];
    for (const key of selected) {
        const value = await dbc.get(`${chatId}.${key}`);
        if (value?.content) history.push(value);
    }
    return history;
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
    setConfigValue,
    getConfigValue,
    saveConversation,
    getConversationHistory,
    getXpLevel,
    getRank,
    saveSuggest
};