const { JsonDB } = require("./json_db");

const accessDb = new JsonDB("access", {
    dir: "./",
    flushInterval: 200,
});

const DEFAULT_CONFIG = {
    authorizationMode: "blacklist",
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
        authorizationMode: stored.authorizationMode === "whitelist" ? "whitelist" : "blacklist",
        blacklistGroups: Array.isArray(stored.blacklistGroups) ? stored.blacklistGroups : [],
        blacklistUsers: Array.isArray(stored.blacklistUsers) ? stored.blacklistUsers : [],
        commands: stored.commands && typeof stored.commands === "object" ? stored.commands : {},
    };
};

const saveConfig = async (config) => {
    await accessDb.set("config", config);
    return config;
};

const updateRegistryRecord = async (collection, identifier, data) => {
    const id = normalizeId(identifier);
    if (!id || !data || typeof data !== "object" || Array.isArray(data)) return false;
    const current = (await accessDb.get(`${collection}.${id}`)) || {};
    await accessDb.set(`${collection}.${id}`, { ...current, ...data, id });
    return true;
};

const updateGroupData = async (gid, data) => updateRegistryRecord("groups", gid, data);

const updateUserData = async (id, data) => updateRegistryRecord("users", id, data);

const setAuthorizationMode = async (mode) => {
    if (!["blacklist", "whitelist"].includes(mode)) return false;
    const config = await getConfig();
    config.authorizationMode = mode;
    await saveConfig(config);
    return true;
};

const approvePendingUser = async (identifier) => {
    const id = normalizeId(identifier);
    if (!id) return false;
    const config = await getConfig();
    if (config.blacklistUsers.includes(id)) return false;
    const key = `users.${id}`;
    const user = await accessDb.get(key);
    if (!user || user.authorizationStatus !== "pending") return false;
    await accessDb.set(key, {
        ...user,
        authorizationStatus: "approved",
        authorizationUpdatedAt: new Date().toISOString(),
    });
    return true;
};

const getParticipantIdentity = (participant) => {
    const data = typeof participant === "string" ? { id: participant } : participant || {};
    const jid = getCanonicalJid(data.phoneNumber || data.id, data.id);
    const id = normalizeId(jid);
    const lid = data.lid || (String(data.id || "").endsWith("@lid") ? data.id : "");
    return {
        id,
        jid,
        lid,
        name: data.notify || data.name || "",
    };
};

const setUserGroupMembership = async (gid, participant, isMember) => {
    const identity = getParticipantIdentity(participant);
    if (!identity.id) return;

    const key = `users.${identity.id}`;
    const current = (await accessDb.get(key)) || {};
    if (!isMember && Object.keys(current).length === 0) return;

    const groupIds = Array.isArray(current.groupIds) ? current.groupIds : [];
    const nextGroupIds = isMember
        ? (groupIds.includes(gid) ? groupIds : [...groupIds, gid])
        : groupIds.filter((groupId) => groupId !== gid);
    const user = {
        ...current,
        id: identity.id,
        groupIds: nextGroupIds,
    };
    if (isMember && current.authorizationStatus === "pending") {
        user.authorizationStatus = "member";
        user.pendingNotifiedAt = undefined;
        user.pendingNotificationAttemptedAt = undefined;
        user.pendingUserNotifiedAt = undefined;
        user.pendingUserNotificationAttemptedAt = undefined;
    }
    if (identity.jid) user.jid = identity.jid;
    if (identity.lid) user.lid = identity.lid;
    if (identity.name && !current.name) user.name = identity.name;
    await accessDb.set(key, user);
};

const syncGroupMetadata = async (metadata, syncParticipants = true) => {
    const groupJid = String(metadata?.id || "");
    const gid = normalizeId(groupJid);
    if (!gid || !groupJid.toLowerCase().endsWith("@g.us")) return false;

    const key = `groups.${gid}`;
    const current = (await accessDb.get(key)) || {};
    const group = {
        ...current,
        id: gid,
        jid: groupJid,
        enabled: typeof current.enabled === "boolean" ? current.enabled : false,
        blockedUsers: Array.isArray(current.blockedUsers) ? current.blockedUsers : [],
    };
    if (typeof metadata.subject === "string") group.name = metadata.subject;
    if (typeof metadata.desc === "string") group.description = metadata.desc;

    for (const field of [
        "announce",
        "restrict",
        "memberAddMode",
        "joinApprovalMode",
        "owner",
        "creation",
        "size",
        "linkedParent",
        "isCommunity",
    ]) {
        if (Object.prototype.hasOwnProperty.call(metadata, field)) {
            group[field] = metadata[field];
        }
    }

    await accessDb.set(key, group);
    if (syncParticipants && Array.isArray(metadata.participants)) {
        await syncGroupParticipants(gid, metadata.participants);
    }
    return true;
};

const syncGroupParticipants = async (groupId, participants, action) => {
    const gid = normalizeId(groupId);
    if (!gid || !Array.isArray(participants)) return false;

    const groupKey = `groups.${gid}`;
    const currentGroup = (await accessDb.get(groupKey)) || {};
    if (!currentGroup.id) {
        await accessDb.set(groupKey, {
            ...currentGroup,
            id: gid,
            jid: String(groupId || "").includes("@") ? String(groupId) : `${gid}@g.us`,
            enabled: false,
            blockedUsers: [],
        });
    }

    if (action === undefined) {
        const memberIds = new Set(
            participants
                .map((participant) => getParticipantIdentity(participant).id)
                .filter(Boolean),
        );
        const users = (await accessDb.get("users")) || {};
        const removals = [];
        for (const [userId, user] of Object.entries(users)) {
            const groupIds = Array.isArray(user.groupIds) ? user.groupIds : [];
            if (
                groupIds.includes(gid) &&
                !memberIds.has(normalizeId(userId))
            ) {
                removals.push(setUserGroupMembership(gid, { id: userId }, false));
            }
        }
        await Promise.all(removals);
        await Promise.all(participants.map((participant) => setUserGroupMembership(gid, participant, true)));
        return true;
    }

    const isMember = action !== "remove";
    await Promise.all(participants.map((participant) => setUserGroupMembership(gid, participant, isMember)));
    return true;
};

const isOwner = (msg) => {
    const ownerId = normalizeId(process.env.owner);
    if (!ownerId) return false;
    return getMessageIds(msg).userId === ownerId;
};

const isAuthorized = async (msg, sock) => {
    if (isOwner(msg)) return true;

    const config = await getConfig();
    const { groupId, userId } = getMessageIds(msg);
    const currentUser = userId ? (await accessDb.get(`users.${userId}`)) || {} : {};

    if (groupId) {
        const group = (await accessDb.get(`groups.${groupId}`)) || {};
        const blockedUsers = Array.isArray(group.blockedUsers) ? group.blockedUsers : [];
        if (blockedUsers.includes(userId) || config.blacklistUsers.includes(userId)) return false;
        if (config.blacklistGroups.includes(groupId)) return false;
    } else if (config.blacklistUsers.includes(userId)) {
        return false;
    }

    if (config.authorizationMode !== "whitelist") return true;
    if (!userId) return false;
    const hasSharedGroup = Array.isArray(currentUser.groupIds) && currentUser.groupIds.length > 0;
    if (currentUser.authorizationStatus === "approved") return true;
    if (hasSharedGroup) {
        if (currentUser.authorizationStatus === "pending") {
            await accessDb.set(`users.${userId}`, {
                ...currentUser,
                authorizationStatus: "member",
                pendingNotifiedAt: undefined,
                pendingNotificationAttemptedAt: undefined,
                pendingUserNotifiedAt: undefined,
                pendingUserNotificationAttemptedAt: undefined,
            });
        }
        return true;
    }
    if (currentUser.authorizationStatus === "member") {
        currentUser.authorizationStatus = undefined;
    }

    const now = new Date().toISOString();
    const user = {
        ...currentUser,
        id: userId,
        authorizationStatus: "pending",
        authorizationRequestedAt: currentUser.authorizationRequestedAt || now,
    };
    await accessDb.set(`users.${userId}`, user);

    const ownerId = normalizeId(process.env.owner);
    if (!ownerId || !sock?.sendMessage) {
        console.error("No se pudo notificar al propietario sobre un usuario pendiente: falta owner o el socket.");
        return false;
    }

    if (!user.pendingNotifiedAt) {
        const lastOwnerAttempt = Date.parse(user.pendingNotificationAttemptedAt || "");
        if (
            Number.isFinite(lastOwnerAttempt) &&
            Date.now() - lastOwnerAttempt < 5 * 60 * 1000
        ) {
            return false;
        }

        user.pendingNotificationAttemptedAt = now;
        await accessDb.set(`users.${userId}`, user);
        try {
            await sock.sendMessage(`${ownerId}@s.whatsapp.net`, {
                text: `Solicitud de autorización pendiente.\nUsuario: ${user.name || "Sin nombre"}\nID: ${userId}\nUsa ${process.env.prefix || "!"}access approve ${userId} o autorízalo desde el panel web.`,
            });
            user.pendingNotifiedAt = new Date().toISOString();
            user.pendingNotificationAttemptedAt = undefined;
            await accessDb.set(`users.${userId}`, user);
        } catch (error) {
            console.error(`No se pudo notificar al propietario sobre el usuario pendiente ${userId}:`, error);
            return false;
        }
    }

    if (!user.pendingUserNotifiedAt) {
        const lastUserAttempt = Date.parse(user.pendingUserNotificationAttemptedAt || "");
        if (
            Number.isFinite(lastUserAttempt) &&
            Date.now() - lastUserAttempt < 5 * 60 * 1000
        ) {
            return false;
        }

        user.pendingUserNotificationAttemptedAt = now;
        await accessDb.set(`users.${userId}`, user);
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "No estás autorizado para usar el bot. El administrador ya fue notificado y tu solicitud está pendiente de autorización.",
            });
            user.pendingUserNotifiedAt = new Date().toISOString();
            user.pendingUserNotificationAttemptedAt = undefined;
            await accessDb.set(`users.${userId}`, user);
        } catch (error) {
            console.error(`No se pudo notificar al usuario pendiente ${userId}:`, error);
        }
    }
    return false;
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
            authorizationStatus:
                identity.groupId && currentUser.authorizationStatus === "pending"
                    ? "member"
                    : currentUser.authorizationStatus,
            pendingNotifiedAt:
                identity.groupId && currentUser.authorizationStatus === "pending"
                    ? undefined
                    : currentUser.pendingNotifiedAt,
            pendingNotificationAttemptedAt:
                identity.groupId && currentUser.authorizationStatus === "pending"
                    ? undefined
                    : currentUser.pendingNotificationAttemptedAt,
            pendingUserNotifiedAt:
                identity.groupId && currentUser.authorizationStatus === "pending"
                    ? undefined
                    : currentUser.pendingUserNotifiedAt,
            pendingUserNotificationAttemptedAt:
                identity.groupId && currentUser.authorizationStatus === "pending"
                    ? undefined
                    : currentUser.pendingUserNotificationAttemptedAt,
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

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const isSafeRegistryId = (id) => typeof id === "string" && id === normalizeId(id) && /^[a-z0-9_-]+$/.test(id);

const createAccessBackup = async () => ({
    format: "cyopn-access-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: await getAccessRegistry(),
});

const restoreAccessBackup = async (backup) => {
    if (!isPlainObject(backup) || backup.format !== "cyopn-access-backup" || backup.version !== 1) {
        throw new Error("Formato de respaldo no compatible.");
    }
    const data = backup.data;
    if (!isPlainObject(data) || !isPlainObject(data.config) || !isPlainObject(data.groups) || !isPlainObject(data.users)) {
        throw new Error("El respaldo no contiene configuración y registros válidos.");
    }

    const { config, groups, users } = data;
    if (
        !["blacklist", "whitelist"].includes(config.authorizationMode) ||
        !Array.isArray(config.blacklistGroups) ||
        !Array.isArray(config.blacklistUsers) ||
        !isPlainObject(config.commands)
    ) {
        throw new Error("La configuración de acceso del respaldo no es válida.");
    }
    if (![...config.blacklistGroups, ...config.blacklistUsers].every(isSafeRegistryId)) {
        throw new Error("El respaldo contiene un ID inválido en las listas de acceso.");
    }

    const validateRecords = (records, collection) => {
        for (const [id, record] of Object.entries(records)) {
            if (!isSafeRegistryId(id) || !isPlainObject(record) || (record.id && normalizeId(record.id) !== id)) {
                throw new Error(`Registro inválido en ${collection}: ${id}.`);
            }
            if (collection === "groups" && record.blockedUsers !== undefined) {
                if (!Array.isArray(record.blockedUsers) || !record.blockedUsers.every(isSafeRegistryId)) {
                    throw new Error(`Participantes bloqueados inválidos en el grupo ${id}.`);
                }
            }
            if (collection === "users") {
                if (record.groupIds !== undefined && (!Array.isArray(record.groupIds) || !record.groupIds.every(isSafeRegistryId))) {
                    throw new Error(`Grupos inválidos en el usuario ${id}.`);
                }
                if (
                    record.authorizationStatus !== undefined &&
                    !["pending", "approved", "member"].includes(record.authorizationStatus)
                ) {
                    throw new Error(`Estado de autorización inválido para el usuario ${id}.`);
                }
            }
        }
    };

    validateRecords(groups, "groups");
    validateRecords(users, "users");

    const normalizedConfig = {
        authorizationMode: config.authorizationMode,
        blacklistGroups: [...config.blacklistGroups],
        blacklistUsers: [...config.blacklistUsers],
        commands: { ...config.commands },
    };

    for (const root of ["config", "groups", "users"]) accessDb.delete(root);
    if (!accessDb.set("config", normalizedConfig)) throw new Error("No se pudo restaurar la configuración.");
    for (const [id, group] of Object.entries(groups)) {
        if (!accessDb.set(`groups.${id}`, { ...group, id })) throw new Error(`No se pudo restaurar el grupo ${id}.`);
    }
    for (const [id, user] of Object.entries(users)) {
        if (!accessDb.set(`users.${id}`, { ...user, id })) throw new Error(`No se pudo restaurar el usuario ${id}.`);
    }

    return { groups: Object.keys(groups).length, users: Object.keys(users).length };
};

module.exports = {
    getConfig,
    getAccessRegistry,
    createAccessBackup,
    restoreAccessBackup,
    getMessageIds,
    isTrackableMessage,
    isCommandEnabled,
    isAuthorized,
    isOwner,
    normalizeId,
    registerAccessMessage,
    updateGroupData,
    updateUserData,
    setAuthorizationMode,
    approvePendingUser,
    syncGroupMetadata,
    syncGroupParticipants,
    setGroupEnabled,
    setGroupUserBlocked,
    setCommandEnabled,
    updateList,
};