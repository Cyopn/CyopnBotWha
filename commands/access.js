require("dotenv").config();
const { prefix } = process.env;
const { errorHandler } = require("../lib/functions");
const { getAccessRegistry, getConfig, getMessageIds, isOwner, updateList } = require("../lib/access");

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
                "Modo: blacklist",
                `Grupos bloqueados: ${config.blacklistGroups.length ? config.blacklistGroups.join(", ") : "ninguno"}`,
                `Personas bloqueadas: ${config.blacklistUsers.length ? config.blacklistUsers.join(", ") : "ninguna"}`,
            ].join("\n");
            return sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
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
            return sock.sendMessage(msg.key.remoteJid, { text: `Uso: ${prefix}access deny|allow group|user [ID]\n${prefix}access status` }, { quoted: msg });
        }

        const value = argv[2] || (type.startsWith("group") ? getMessageIds(msg).groupId : getMessageIds(msg).userId);
        await updateList(listNames[type], value, operation);
        return sock.sendMessage(msg.key.remoteJid, { text: `${operation === "remove" ? "Bloqueo eliminado" : "Entrada bloqueada"}: ${value || "ID invalido"}.` }, { quoted: msg });
    } catch (error) {
        return errorHandler(sock, msg, this.config.name, error);
    }
};

module.exports.config = {
    name: "access",
    alias: ["acceso", "acl"],
    type: "admin",
    description: "Administra la lista negra del bot.",
};