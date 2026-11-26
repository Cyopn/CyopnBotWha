const { randomBytes } = require("crypto");
const { JsonDB } = require("./json_db");

const auditDb = new JsonDB("admin_audit", { dir: "./", flushInterval: 200 });
const MAX_AUDIT_RECORDS = 500;

const recordAdminAction = async ({ actor, action, target = "", details = "" }) => {
    const timestamp = new Date().toISOString();
    const id = `${Date.now()}_${randomBytes(4).toString("hex")}`;
    await auditDb.set(id, {
        id,
        timestamp,
        actor: String(actor || "desconocido"),
        action: String(action || "acción"),
        target: String(target || ""),
        details: String(details || ""),
    });

    const keys = await auditDb.keys();
    const stale = keys.sort().slice(0, Math.max(0, keys.length - MAX_AUDIT_RECORDS));
    for (const key of stale) auditDb.delete(key);
    return id;
};

const getRecentAdminActions = async (limit = 100) => {
    const keys = (await auditDb.keys()).sort().reverse().slice(0, Math.max(0, limit));
    const records = await Promise.all(keys.map((key) => auditDb.get(key)));
    return records.filter(Boolean);
};

module.exports = { getRecentAdminActions, recordAdminAction };
