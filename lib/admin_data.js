const { JsonDB } = require("./json_db");

const metricsDb = new JsonDB("metrics", { dir: "./", flushInterval: 200 });
const errorDb = new JsonDB("error", { dir: "./", flushInterval: 200 });
const suggestDb = new JsonDB("suggest", { dir: "./", flushInterval: 200 });

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const recordMessageMetric = async (msg) => {
    const day = dayKey();
    const remoteJid = String(msg?.key?.remoteJid || "");
    const isGroup = remoteJid.endsWith("@g.us");
    const groupId = isGroup ? remoteJid.split("@")[0] : "direct";
    await metricsDb.update(`messages.${day}`, {
        $inc: { total: 1, groups: isGroup ? 1 : 0, direct: isGroup ? 0 : 1 },
    });
    await metricsDb.update(`messageGroups.${day}.${groupId}`, { $inc: { total: 1 } });
};

const recordCommandMetric = async (command, msg) => {
    const day = dayKey();
    const groupId = String(msg?.key?.remoteJid || "").endsWith("@g.us")
        ? String(msg.key.remoteJid).split("@")[0]
        : "direct";
    await metricsDb.update(`commands.${day}.${command}`, { $inc: { total: 1 } });
    await metricsDb.update(`commandGroups.${day}.${groupId}.${command}`, { $inc: { total: 1 } });
};

const getMetrics = async (filters = {}) => {
    const allMessages = (await metricsDb.get("messages")) || {};
    const messagesByGroup = (await metricsDb.get("messageGroups")) || {};
    const allCommands = (await metricsDb.get("commands")) || {};
    const commandsByGroup = (await metricsDb.get("commandGroups")) || {};
    const from = String(filters.from || "");
    const to = String(filters.to || "");
    const groupId = String(filters.groupId || "").trim();
    const commandName = String(filters.command || "").trim();
    const days = new Set([
        ...Object.keys(allMessages),
        ...Object.keys(allCommands),
        ...Object.keys(messagesByGroup),
        ...Object.keys(commandsByGroup),
    ]);
    const messages = {};
    const commands = {};

    for (const day of days) {
        if ((from && day < from) || (to && day > to)) continue;

        const messageData = groupId
            ? messagesByGroup[day]?.[groupId]
            : allMessages[day];
        if (messageData) {
            const total = Number(messageData.total) || 0;
            messages[day] = groupId
                ? { total, groups: groupId === "direct" ? 0 : total, direct: groupId === "direct" ? total : 0 }
                : messageData;
        }

        const dailyCommands = groupId
            ? commandsByGroup[day]?.[groupId] || {}
            : allCommands[day] || {};
        const filteredCommands = Object.fromEntries(
            Object.entries(dailyCommands).filter(([name]) => !commandName || name === commandName),
        );
        if (Object.keys(filteredCommands).length) commands[day] = filteredCommands;
    }

    return { messages, commands };
};

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
