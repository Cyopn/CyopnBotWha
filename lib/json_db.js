const fs = require("fs");
const path = require("path");

class JsonDB {
    constructor(name, options = {}) {
        this.name = String(name);
        this.rootDir = path.resolve(options.dir || ".", "db");
        this.dbDir = path.join(this.rootDir, this.name);

        this.blockPrefix = "block_";
        this.blockDigits = 4;
        this.blockExt = ".json";
        this.fileName = `${this.blockPrefix}${String(1).padStart(this.blockDigits, "0")}${this.blockExt}`;

        this.filePath = path.join(this.dbDir, this.fileName);
        this.legacyFilePath = path.join(this.dbDir, `${this.name}.json`);
        this.indexFilePath = path.join(this.dbDir, "indexes.json");

        this.blockMaxBytes =
            typeof options.blockMaxBytes === "number"
                ? options.blockMaxBytes
                : 5 * 1024 * 1024;
        this.blockMaxRoots =
            typeof options.blockMaxRoots === "number" ? options.blockMaxRoots : 1000;
        this.flushInterval =
            typeof options.flushInterval === "number" ? options.flushInterval : 0;

        this._blocks = new Map();
        this._index = { version: 1, map: {}, blocks: {} };
        this._dirtyBlocks = new Set();
        this._dirtyIndex = false;
        this._flushTimer = null;
        this._isFlushing = false;
        this._pendingFlush = false;

        this._ensureStorage();
        this._loadIndex();
    }

    _ensureStorage() {
        fs.mkdirSync(this.dbDir, { recursive: true });
        this._recoverTempFiles();

        const blocks = this._scanBlockFiles();
        if (blocks.length === 0 && fs.existsSync(this.legacyFilePath)) {
            try {
                fs.renameSync(this.legacyFilePath, this.filePath);
            } catch (_err) {
                try {
                    fs.copyFileSync(this.legacyFilePath, this.filePath);
                } catch (_copyErr) {
                }
            }
        }

        if (this._scanBlockFiles().length === 0 && !fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, "{}\n", "utf8");
        }
    }

    _recoverTempFiles() {
        let files = [];
        try {
            files = fs.readdirSync(this.dbDir);
        } catch (_err) {
            return;
        }
        for (const file of files) {
            if (!file.endsWith(".tmp")) continue;
            const target = path.join(this.dbDir, file.slice(0, -4));
            const temp = path.join(this.dbDir, file);
            this._recoverTempFile(target, temp);
        }
    }

    _recoverTempFile(targetPath, tempPath) {
        if (!fs.existsSync(tempPath)) return;
        let useTemp = !fs.existsSync(targetPath);
        if (!useTemp) {
            try {
                const tempStat = fs.statSync(tempPath);
                const fileStat = fs.statSync(targetPath);
                if (tempStat.mtimeMs > fileStat.mtimeMs) useTemp = true;
            } catch (_err) {
                useTemp = true;
            }
        }
        if (useTemp) {
            try {
                const raw = fs.readFileSync(tempPath, "utf8").trim();
                if (raw) JSON.parse(raw);
                fs.rmSync(targetPath, { force: true });
                fs.renameSync(tempPath, targetPath);
                return;
            } catch (_err) {
            }
        }
        try {
            fs.rmSync(tempPath, { force: true });
        } catch (_err) {
        }
    }

    _scanBlockFiles() {
        let files = [];
        try {
            files = fs.readdirSync(this.dbDir);
        } catch (_err) {
            return [];
        }
        const blocks = files.filter((file) =>
            new RegExp(`^${this.blockPrefix}\\d{${this.blockDigits}}\\${this.blockExt}$`).test(file)
        );
        blocks.sort();
        return blocks;
    }

    _loadIndex() {
        this._recoverTempFile(this.indexFilePath, `${this.indexFilePath}.tmp`);
        let parsed = null;
        if (fs.existsSync(this.indexFilePath)) {
            try {
                const raw = fs.readFileSync(this.indexFilePath, "utf8").trim();
                if (raw) parsed = JSON.parse(raw);
            } catch (_err) {
                parsed = null;
            }
        }

        const blockFiles = this._scanBlockFiles();
        const blockSet = new Set(blockFiles);

        if (parsed && typeof parsed === "object") {
            const normalized = this._normalizeIndex(parsed);
            const indexBlocks = Object.keys(normalized.blocks);
            const missingBlock = indexBlocks.some((b) => !blockSet.has(b));
            const extraBlock = blockFiles.some((b) => !normalized.blocks[b]);
            if (!missingBlock && !extraBlock) {
                this._index = normalized;
                return;
            }
        }

        this._rebuildIndex();
    }

    _normalizeIndex(parsed) {
        const normalized = { version: 1, map: {}, blocks: {} };
        if (!parsed || typeof parsed !== "object") return normalized;

        if (parsed.map && typeof parsed.map === "object") {
            for (const [key, value] of Object.entries(parsed.map)) {
                if (typeof value === "string") normalized.map[key] = value;
            }
        }

        if (parsed.blocks && typeof parsed.blocks === "object") {
            for (const [key, value] of Object.entries(parsed.blocks)) {
                if (!value || typeof value !== "object") continue;
                normalized.blocks[key] = {
                    roots: Number(value.roots) || 0,
                    bytes: Number(value.bytes) || 0,
                    createdAt: value.createdAt || undefined,
                    updatedAt: value.updatedAt || undefined,
                };
            }
        }

        return normalized;
    }

    _rebuildIndex() {
        let blocks = this._scanBlockFiles();
        if (blocks.length === 0) {
            if (!fs.existsSync(this.filePath)) {
                fs.writeFileSync(this.filePath, "{}\n", "utf8");
            }
            blocks = [this.fileName];
        }

        const map = {};
        const meta = {};

        for (const blockName of blocks) {
            const blockPath = this._getBlockPath(blockName);
            this._recoverTempFile(blockPath, `${blockPath}.tmp`);
            const data = this._readBlockData(blockPath);
            const roots = Object.keys(data);
            for (const root of roots) {
                map[root] = blockName;
            }

            let stat = null;
            try {
                stat = fs.statSync(blockPath);
            } catch (_err) {
                stat = null;
            }
            meta[blockName] = {
                roots: roots.length,
                bytes: stat ? stat.size : 0,
                createdAt: stat ? stat.birthtime.toISOString() : undefined,
                updatedAt: stat ? stat.mtime.toISOString() : undefined,
            };
        }

        this._index = { version: 1, map, blocks: meta };
        this._dirtyIndex = true;
        this._flushIndex();
    }

    _readBlockData(blockPath) {
        if (!fs.existsSync(blockPath)) {
            fs.writeFileSync(blockPath, "{}\n", "utf8");
            return {};
        }
        try {
            const raw = fs.readFileSync(blockPath, "utf8").trim();
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                if (
                    parsed.data &&
                    typeof parsed.data === "object" &&
                    !Array.isArray(parsed.data)
                ) {
                    return parsed.data;
                }
                return parsed;
            }
            return {};
        } catch (_err) {
            return {};
        }
    }

    _loadBlock(blockName) {
        if (this._blocks.has(blockName)) return this._blocks.get(blockName);
        const blockPath = this._getBlockPath(blockName);
        this._recoverTempFile(blockPath, `${blockPath}.tmp`);
        const data = this._readBlockData(blockPath);
        this._blocks.set(blockName, data);

        if (!this._index.blocks[blockName]) {
            const meta = this._getBlockMeta(blockName, true);
            meta.roots = Object.keys(data).length;
            meta.bytes = this._getBlockSize(blockName, meta);
            if (!meta.createdAt) meta.createdAt = new Date().toISOString();
            meta.updatedAt = meta.createdAt;
            this._dirtyIndex = true;
        }

        return data;
    }

    _splitKey(key) {
        if (key === undefined || key === null) return [];
        return String(key).split(".");
    }

    _getRootKey(parts) {
        if (!Array.isArray(parts) || parts.length === 0) return "";
        return parts[0];
    }

    _resolveBlockForRoot(rootKey, create) {
        if (!rootKey) return null;
        const existing = this._index.map[rootKey];
        if (existing) return existing;
        if (!create) return null;

        const blockName = this._selectBlockForNewRoot();
        this._index.map[rootKey] = blockName;
        const meta = this._getBlockMeta(blockName, true);
        meta.roots = Number(meta.roots || 0) + 1;
        const now = new Date().toISOString();
        if (!meta.createdAt) meta.createdAt = now;
        meta.updatedAt = now;
        this._dirtyIndex = true;

        return blockName;
    }

    _selectBlockForNewRoot() {
        const maxRoots = this.blockMaxRoots > 0 ? this.blockMaxRoots : Number.MAX_SAFE_INTEGER;
        const maxBytes = this.blockMaxBytes > 0 ? this.blockMaxBytes : Number.MAX_SAFE_INTEGER;
        const blockNames = Object.keys(this._index.blocks).sort();
        for (const blockName of blockNames) {
            const meta = this._getBlockMeta(blockName, true);
            const size = this._getBlockSize(blockName, meta);
            if (meta.roots < maxRoots && size < maxBytes) return blockName;
        }
        return this._createBlock();
    }

    _createBlock() {
        const blockName = this._getNextBlockName();
        const blockPath = this._getBlockPath(blockName);
        if (!fs.existsSync(blockPath)) {
            fs.writeFileSync(blockPath, "{}\n", "utf8");
        }
        const meta = this._getBlockMeta(blockName, true);
        const now = new Date().toISOString();
        if (!meta.createdAt) meta.createdAt = now;
        meta.updatedAt = now;
        meta.bytes = this._getBlockSize(blockName, meta);
        return blockName;
    }

    _getNextBlockName() {
        const blockNames = this._scanBlockFiles();
        let max = 0;
        for (const name of blockNames) {
            const match = name.match(/\d+/);
            if (!match) continue;
            const num = Number(match[0]);
            if (Number.isFinite(num) && num > max) max = num;
        }
        return this._formatBlockName(max + 1);
    }

    _formatBlockName(num) {
        const safe = Number.isFinite(num) && num > 0 ? num : 1;
        return `${this.blockPrefix}${String(safe).padStart(this.blockDigits, "0")}${this.blockExt}`;
    }

    _getBlockPath(blockName) {
        return path.join(this.dbDir, blockName);
    }

    _getBlockMeta(blockName, create) {
        if (!this._index.blocks[blockName] && create) {
            this._index.blocks[blockName] = {
                roots: 0,
                bytes: 0,
                createdAt: undefined,
                updatedAt: undefined,
            };
        }
        return this._index.blocks[blockName];
    }

    _getBlockSize(blockName, meta) {
        if (meta && Number(meta.bytes) > 0) return Number(meta.bytes);
        const blockPath = this._getBlockPath(blockName);
        try {
            const stat = fs.statSync(blockPath);
            if (meta) meta.bytes = stat.size;
            return stat.size;
        } catch (_err) {
            return 0;
        }
    }

    _getNode(base, parts, create) {
        let node = base;
        for (let i = 0; i < parts.length - 1; i += 1) {
            const part = parts[i];
            if (
                !Object.prototype.hasOwnProperty.call(node, part) ||
                typeof node[part] !== "object" ||
                node[part] === null
            ) {
                if (!create) return { parent: null, key: "" };
                node[part] = {};
            }
            node = node[part];
        }
        return { parent: node, key: parts[parts.length - 1] };
    }

    _getValue(base, parts) {
        let node = base;
        for (const part of parts) {
            if (!Object.prototype.hasOwnProperty.call(node, part)) return undefined;
            node = node[part];
        }
        return node;
    }

    has(key) {
        const parts = this._splitKey(key);
        if (parts.length === 0) return false;
        const rootKey = this._getRootKey(parts);
        const blockName = this._resolveBlockForRoot(rootKey, false);
        if (!blockName) return false;
        const data = this._loadBlock(blockName);
        return this._getValue(data, parts) !== undefined;
    }

    get(key) {
        const parts = this._splitKey(key);
        if (parts.length === 0) return undefined;
        const rootKey = this._getRootKey(parts);
        const blockName = this._resolveBlockForRoot(rootKey, false);
        if (!blockName) return undefined;
        const data = this._loadBlock(blockName);
        return this._getValue(data, parts);
    }

    set(key, value) {
        const parts = this._splitKey(key);
        if (parts.length === 0) return false;
        const rootKey = this._getRootKey(parts);
        const blockName = this._resolveBlockForRoot(rootKey, true);
        if (!blockName) return false;
        const data = this._loadBlock(blockName);
        const { parent, key: lastKey } = this._getNode(data, parts, true);
        if (!parent) return false;
        parent[lastKey] = value;
        this._scheduleFlush(blockName);
        return true;
    }

    update(key, updateOps = {}) {
        const parts = this._splitKey(key);
        if (parts.length === 0) return undefined;
        const rootKey = this._getRootKey(parts);
        const blockName = this._resolveBlockForRoot(rootKey, true);
        if (!blockName) return undefined;
        const data = this._loadBlock(blockName);
        const { parent, key: lastKey } = this._getNode(data, parts, true);
        if (!parent) return undefined;
        if (!parent[lastKey] || typeof parent[lastKey] !== "object") {
            parent[lastKey] = {};
        }
        const target = parent[lastKey];
        const { $set, $inc } = updateOps;
        if ($set && typeof $set === "object") {
            for (const [k, v] of Object.entries($set)) {
                target[k] = v;
            }
        }
        if ($inc && typeof $inc === "object") {
            for (const [k, v] of Object.entries($inc)) {
                const current = Number(target[k]) || 0;
                const inc = Number(v) || 0;
                target[k] = current + inc;
            }
        }
        this._scheduleFlush(blockName);
        return target;
    }

    keys(prefix) {
        const parts = this._splitKey(prefix);
        if (parts.length === 0) return Object.keys(this._index.map);
        const rootKey = this._getRootKey(parts);
        const blockName = this._resolveBlockForRoot(rootKey, false);
        if (!blockName) return [];
        const data = this._loadBlock(blockName);
        const value = this._getValue(data, parts);
        if (value && typeof value === "object") return Object.keys(value);
        return [];
    }

    _scheduleFlush(blockName) {
        if (blockName) this._dirtyBlocks.add(blockName);
        if (this._isFlushing) {
            this._pendingFlush = true;
            return;
        }
        if (this.flushInterval <= 0) {
            this._flush();
            return;
        }
        if (this._flushTimer) return;
        this._flushTimer = setTimeout(() => {
            this._flushTimer = null;
            this._flush();
        }, this.flushInterval);
    }

    _flush() {
        if (this._isFlushing) return;
        this._isFlushing = true;

        const blocksToFlush = Array.from(this._dirtyBlocks);
        this._dirtyBlocks.clear();

        for (const blockName of blocksToFlush) {
            const data = this._loadBlock(blockName);
            const content = JSON.stringify(data, null, 2);
            const payload = `${content}\n`;
            this._writeFileAtomically(this._getBlockPath(blockName), payload);

            const meta = this._getBlockMeta(blockName, true);
            meta.bytes = Buffer.byteLength(payload);
            meta.roots = Object.keys(data).length;
            const now = new Date().toISOString();
            if (!meta.createdAt) meta.createdAt = now;
            meta.updatedAt = now;
            this._dirtyIndex = true;
        }

        if (this._dirtyIndex) {
            this._flushIndex();
        }

        this._isFlushing = false;
        if (this._pendingFlush) {
            this._pendingFlush = false;
            this._scheduleFlush();
        }
    }

    _flushIndex() {
        try {
            const content = JSON.stringify(this._index, null, 2);
            this._writeFileAtomically(this.indexFilePath, `${content}\n`);
            this._dirtyIndex = false;
        } catch (_err) {
        }
    }

    _writeFileAtomically(targetPath, content) {
        const tempPath = `${targetPath}.tmp`;
        const fd = fs.openSync(tempPath, "w");
        try {
            fs.writeSync(fd, content);
            fs.fsyncSync(fd);
        } finally {
            fs.closeSync(fd);
        }
        try {
            fs.rmSync(targetPath, { force: true });
        } catch (_err) {
        }
        fs.renameSync(tempPath, targetPath);
    }
}

module.exports = { JsonDB };