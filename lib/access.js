const { JsonDB } = require("./json_db");

const accessDb = new JsonDB("access", {
    dir: "./",
    flushInterval: 200,
});

const DEFAULT_CONFIG = {
    blacklistGroups: [],
    blacklistUsers: [],
    commands: {},
};

const normalizeId = (value) => {
    let id = String(value || "").trim().toLowerCase();
    if (!id) return "";
    id = id.replace(/^\+/, "");
    id = id.replace(/:\d+(?=@)/, "");
    return id.replace(/@(s\.whatsapp\.net|g\.us|lid)$/, "");
};

const getCanonicalJid = (primary, alternate) => {
    const primaryText = String(primary || "");
    const alternateText = String(alternate || "");
    return primaryText.endsWith("@lid") && alternateText ? alternateText : primaryText;
};

const isIgnoredJid = (jid) => {
    const value = String(jid || "").toLowerCase();
    return value === "status@broadcast" || value.endsWith("@newsletter") || value.endsWith("@broadcast");
};

const isTrackableMessage = (msg) => !isIgnoredJid(getCanonicalJid(msg?.key?.remoteJid, msg?.key?.remoteJidAlt));

const getMessageIds = (msg) => {
    const remoteJid = getCanonicalJid(msg?.key?.remoteJid, msg?.key?.remoteJidAlt);
    const participant = getCanonicalJid(
        msg?.key?.participantPn || msg?.key?.participant,
        msg?.key?.participantAlt,
    );
    const isGroup = remoteJid.endsWith("@g.us");
    return {
        groupId: isGroup ? normalizeId(remoteJid) : "",
        userId: normalizeId(isGroup ? participant : remoteJid),
    };
};

const getMessageIdentity = (msg) => {
    const remoteJid = getCanonicalJid(msg?.key?.remoteJid, msg?.key?.remoteJidAlt);
    const participantJid = getCanonicalJid(
        msg?.key?.participantPn || msg?.key?.participant,
        msg?.key?.participantAlt,
    );
    const ids = getMessageIds(msg);
    return {
        ...ids,
        remoteJid,
        participantJid,
        participantLid: String(msg?.key?.participant || "").endsWith("@lid") ? String(msg.key.participant) : "",
        remoteLid: String(msg?.key?.remoteJid || "").endsWith("@lid") ? String(msg.key.remoteJid) : "",
    };
};

const getConfig = async () => {
    const stored = (await accessDb.get("config")) || {};
    return {
        ...DEFAULT_CONFIG,
        blacklistGroups: Array.isArray(stored.blacklistGroups) ? stored.blacklistGroups : [],
        blacklistUsers: Array.isArray(stored.blacklistUsers) ? stored.blacklistUsers : [],
        commands: stored.commands && typeof stored.commands === "object" ? stored.commands : {},
    };
};

const saveConfig = async (config) => {
    await accessDb.set("config", config);
    return config;
};

const isOwner = (msg) => {
    const ownerId = normalizeId(process.env.owner);
    if (!ownerId) return false;
    return getMessageIds(msg).userId === ownerId;
};

const isAuthorized = async (msg) => {
    if (isOwner(msg)) return true;

    const config = await getConfig();
    const { groupId, userId } = getMessageIds(msg);
    if (groupId) {
        const group = (await accessDb.get(`groups.${groupId}`)) || {};
        const blockedUsers = Array.isArray(group.blockedUsers) ? group.blockedUsers : [];
        if (blockedUsers.includes(userId) || config.blacklistUsers.includes(userId)) return false;
        return !config.blacklistGroups.includes(groupId);
    }

    if (config.blacklistUsers.includes(userId)) return false;
    return true;
};

const setGroupEnabled = async (groupId, enabled) => {
    const id = normalizeId(groupId);
    if (!id) return false;
    const config = await getConfig();
    config.blacklistGroups = enabled
        ? config.blacklistGroups.filter((item) => item !== id)
        : (config.blacklistGroups.includes(id) ? config.blacklistGroups : [...config.blacklistGroups, id]);
    await saveConfig(config);
    const group = (await accessDb.get(`groups.${id}`)) || {};
    await accessDb.set(`groups.${id}`, { ...group, enabled: Boolean(enabled), id });
    return true;
};

const setGroupUserBlocked = async (groupId, userId, blocked) => {
    const group = (await accessDb.get(`groups.${normalizeId(groupId)}`)) || {};
    const current = Array.isArray(group.blockedUsers) ? group.blockedUsers : [];
    const id = normalizeId(userId);
    const blockedUsers = blocked
        ? (current.includes(id) ? current : [...current, id])
        : current.filter((item) => item !== id);
    await accessDb.set(`groups.${normalizeId(groupId)}`, { ...group, id: normalizeId(groupId), blockedUsers });
    return true;
};

const updateList = async (listName, value, action) => {
    const config = await getConfig();
    const normalized = normalizeId(value);
    if (!normalized || !["blacklistGroups", "blacklistUsers"].includes(listName)) return config;
    const list = config[listName];
    if (action === "remove") {
        config[listName] = list.filter((item) => item !== normalized);
    } else if (!list.includes(normalized)) {
        config[listName] = [...list, normalized];
    }
    return saveConfig(config);
};

const isCommandEnabled = async (commandName) => {
    const config = await getConfig();
    return config.commands[String(commandName || "")] !== false;
};

const setCommandEnabled = async (commandName, enabled) => {
    const config = await getConfig();
    const name = String(commandName || "").trim();
    if (!name) return config;
    config.commands = { ...config.commands, [name]: Boolean(enabled) };
    return saveConfig(config);
};

const registerAccessMessage = async (msg, sock) => {
    const identity = getMessageIdentity(msg);
    const now = new Date().toISOString();
    const updates = [];

    if (identity.groupId) {
        const currentGroup = (await accessDb.get(`groups.${identity.groupId}`)) || {};
        let groupName = currentGroup.name || "";
        if (!groupName && sock?.groupMetadata && identity.remoteJid.endsWith("@g.us")) {
            try {
                const metadata = await sock.groupMetadata(identity.remoteJid);
                groupName = metadata?.subject || "";
            } catch (_error) {
            }
        }
        updates.push(accessDb.set(`groups.${identity.groupId}`, {
            ...currentGroup,
            id: identity.groupId,
            jid: identity.remoteJid,
            name: groupName,
            enabled: typeof currentGroup.enabled === "boolean" ? currentGroup.enabled : false,
            blockedUsers: Array.isArray(currentGroup.blockedUsers) ? currentGroup.blockedUsers : [],
            lastSeen: now,
        }));
    }

    if (identity.userId) {
        const currentUser = (await accessDb.get(`users.${identity.userId}`)) || {};
        const groupIds = Array.isArray(currentUser.groupIds) ? currentUser.groupIds : [];
        if (identity.groupId && !groupIds.includes(identity.groupId)) groupIds.push(identity.groupId);
        updates.push(accessDb.set(`users.${identity.userId}`, {
            ...currentUser,
            id: identity.userId,
            jid: identity.participantJid || identity.remoteJid,
            lid: identity.participantLid || currentUser.lid || "",
            name: msg?.pushName || currentUser.name || "",
            groupIds,
            lastSeen: now,
        }));
    }

    await Promise.all(updates);
    return identity;
};

const getAccessRegistry = async () => ({
    config: await getConfig(),
    groups: (await accessDb.get("groups")) || {},
    users: Object.fromEntries(Object.entries((await accessDb.get("users")) || {}).filter(([id]) => !isIgnoredJid(id))),
});

module.exports = {
    getConfig,
    getAccessRegistry,
    getMessageIds,
    isTrackableMessage,
    isCommandEnabled,
    isAuthorized,
    isOwner,
    normalizeId,
    registerAccessMessage,
    setGroupEnabled,
    setGroupUserBlocked,
    setCommandEnabled,
    updateList,
};