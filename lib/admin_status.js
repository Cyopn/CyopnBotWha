const startedAt = Date.now();

let state = {
    connection: "starting",
    connectedAt: null,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    lastDisconnectCode: null,
    lastGroupSyncAt: null,
    lastGroupSyncAttemptAt: null,
    lastGroupEventAt: null,
    groupCount: 0,
    groupSyncError: "",
};

const updateConnectionStatus = (connection, disconnectCode = null) => {
    state.connection = String(connection || state.connection);
    if (connection === "open") {
        const now = new Date().toISOString();
        state.connectedAt = now;
        state.lastConnectedAt = now;
        state.lastDisconnectCode = null;
    } else if (connection === "close") {
        state.connectedAt = null;
        state.lastDisconnectedAt = new Date().toISOString();
        state.lastDisconnectCode = disconnectCode === null ? null : String(disconnectCode);
    }
};

const updateGroupSyncStatus = ({ groupCount, error } = {}) => {
    const now = new Date().toISOString();
    state.lastGroupSyncAttemptAt = now;
    if (error) {
        state.groupSyncError = String(error);
        return;
    }
    if (Number.isFinite(groupCount)) state.groupCount = groupCount;
    state.lastGroupSyncAt = now;
    state.groupSyncError = "";
};

const recordGroupEvent = () => {
    state.lastGroupEventAt = new Date().toISOString();
};

const getOperationalStatus = () => ({
    ...state,
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
});

module.exports = {
    getOperationalStatus,
    recordGroupEvent,
    updateConnectionStatus,
    updateGroupSyncStatus,
};
