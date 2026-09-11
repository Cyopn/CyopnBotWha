const { JsonDB } = require("./json_db");

const metricsDb = new JsonDB("metrics", { dir: "./", flushInterval: 200 });
const errorDb = new JsonDB("error", { dir: "./", flushInterval: 200 });
const suggestDb = new JsonDB("suggest", { dir: "./", flushInterval: 200 });

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const recordMessageMetric = async (msg) => {
    const day = dayKey();
    const isGroup = String(msg?.key?.remoteJid || "").endsWith("@g.us");
    await metricsDb.update(`messages.${day}`, {
        $inc: { total: 1, groups: isGroup ? 1 : 0, direct: isGroup ? 0 : 1 },
    });
};

const recordCommandMetric = async (command, msg) => {
    const day = dayKey();
    const groupId = String(msg?.key?.remoteJid || "").endsWith("@g.us")
        ? String(msg.key.remoteJid).split("@")[0]
        : "direct";
    await metricsDb.update(`commands.${day}.${command}`, { $inc: { total: 1 } });
    await metricsDb.update(`commandGroups.${day}.${groupId}.${command}`, { $inc: { total: 1 } });
};

const getMetrics = async () => ({
    messages: (await metricsDb.get("messages")) || {},
    commands: (await metricsDb.get("commands")) || {},
});

const getRecentErrors = async (limit = 40) => {
    const rows = [];
    for (const root of await errorDb.keys()) {
        const values = await errorDb.get(root);
        if (!values || typeof values !== "object") continue;
        for (const [key, value] of Object.entries(values)) rows.push({ id: `${root}.${key}`, ...value });
    }
    return rows.sort((a, b) => String(b.id).localeCompare(String(a.id))).slice(0, limit);
};

const getSuggestions = async (limit = 80) => {
    const rows = [];
    for (const groupId of await suggestDb.keys()) {
        const values = await suggestDb.get(groupId);
        if (!values || typeof values !== "object") continue;
        for (const [key, value] of Object.entries(values)) rows.push({ id: `${groupId}.${key}`, groupId, ...value });
    }
    return rows.sort((a, b) => String(b.id).localeCompare(String(a.id))).slice(0, limit);
};

module.exports = {
    getMetrics,
    getRecentErrors,
    getSuggestions,
    recordCommandMetric,
    recordMessageMetric,
};
