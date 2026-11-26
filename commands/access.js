require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { recordAdminAction } = require("../lib/admin_audit");
const {
    approvePendingUser,
    getAccessRegistry,
    getConfig,
    getMessageIds,
    isOwner,
    setAuthorizationMode,
    updateList,
} = require("../lib/access");

const listNames = { group: "blacklistGroups", groups: "blacklistGroups", user: "blacklistUsers", person: "blacklistUsers", users: "blacklistUsers" };

module.exports.run = async (sock, msg, args) => {
    try {
        if (!isOwner(msg)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Solo el propietario puede administrar el acceso." }, { quoted: msg });
        }

        const argv = Array.isArray(args?.[0]) ? args[0].map((item) => String(item).trim().toLowerCase()).filter(Boolean) : [];
        const action = argv[0] || "status";

        if (action === "status" || action === "estado" || action === "list" || action === "lista") {
            const config = await getConfig();
            const text = [
                `Modo: ${config.authorizationMode}`,
                `Grupos bloqueados: ${config.blacklistGroups.length ? config.blacklistGroups.join(", ") : "ninguno"}`,
                `Personas bloqueadas: ${config.blacklistUsers.length ? config.blacklistUsers.join(", ") : "ninguna"}`,
            ].join("\n");
            return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
        }

        if (action === "mode" || action === "modo") {
            const mode = argv[1];
            if (!await setAuthorizationMode(mode)) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `Uso: ${prefix}access mode blacklist|whitelist`,
                }, { quoted: msg });
            }
            await recordAdminAction({ actor: getMessageIds(msg).userId, action: "authorization-mode", target: mode });
            return sock.sendMessage(msg.key.remoteJid, { text: `Modo de autorización: ${mode}.` }, { quoted: msg });
        }

        if (action === "pending" || action === "pendientes") {
            const registry = await getAccessRegistry();
            const pending = Object.values(registry.users)
                .filter((user) => user.authorizationStatus === "pending" && !registry.config.blacklistUsers.includes(user.id));
            const list = pending.slice(0, 20)
                .map((user) => `${user.name || "Sin nombre"}: ${user.id}`)
                .join("\n");
            const more = pending.length > 20 ? `\n...y ${pending.length - 20} más.` : "";
            return sock.sendMessage(msg.key.remoteJid, {
                text: pending.length
                    ? `Usuarios pendientes (${pending.length}):\n${list}${more}\nAutoriza con ${prefix}access approve <ID>.`
                    : "No hay usuarios pendientes de autorización.",
            }, { quoted: msg });
        }

        if (action === "approve" || action === "autorizar") {
            const userId = argv[1];
            if (!userId) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `Uso: ${prefix}access approve <ID>`,
                }, { quoted: msg });
            }
            const approved = await approvePendingUser(userId);
            if (approved) {
                await recordAdminAction({ actor: getMessageIds(msg).userId, action: "user-approved", target: userId });
            }
            return sock.sendMessage(msg.key.remoteJid, {
                text: approved
                    ? `Usuario autorizado: ${userId}.`
                    : `No se encontró un usuario pendiente con ID ${userId}.`,
            }, { quoted: msg });
        }

        if (action === "known" || action === "registrados" || action === "disponibles") {
            const registry = await getAccessRegistry();
            const groups = Object.values(registry.groups);
            const users = Object.values(registry.users);
            const groupText = groups.length
                ? groups.map((group) => `${group.id}${group.name ? ` (${group.name})` : ""}`).join(", ")
                : "ninguno";
            const userText = users.length
                ? users.map((user) => `${user.id}${user.name ? ` (${user.name})` : ""}`).join(", ")
                : "ninguno";
            return sock.sendMessage(msg.key.remoteJid, {
                text: `Grupos registrados: ${groupText}\nPersonas registradas: ${userText}`,
            }, { quoted: msg });
        }

        const actionMap = { allow: "remove", permitir: "remove", deny: "add", bloquear: "add", remove: "remove", quitar: "remove" };
        const operation = actionMap[action];
        const type = argv[1];
        if (!operation || !listNames[type]) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `Uso:\n${prefix}access mode blacklist|whitelist\n${prefix}access pending\n${prefix}access approve <ID>\n${prefix}access deny|allow group|user [ID]`,
            }, { quoted: msg });
        }

        const value = argv[2] || (type.startsWith("group") ? getMessageIds(msg).groupId : getMessageIds(msg).userId);
        await updateList(listNames[type], value, operation);
        await recordAdminAction({
            actor: getMessageIds(msg).userId,
            action: operation === "add" ? "blacklist-added" : "blacklist-removed",
            target: `${listNames[type]}: ${value}`,
        });
        return sock.sendMessage(msg.key.remoteJid, { text: `${operation === "remove" ? "Bloqueo eliminado" : "Entrada bloqueada"}: ${value || "ID invalido"}.` }, { quoted: msg });
    } catch (error) {
        return errorHandler(sock, msg, module.exports.config.name, error);
    }
};

module.exports.config = {
    name: "access",
    alias: ["acceso", "acl"],
    type: "admin",
    description: "Administra whitelist, blacklist y autorizaciones pendientes.",
};