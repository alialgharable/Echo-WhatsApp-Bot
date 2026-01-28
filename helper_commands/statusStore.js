const statuses = new Map(); // jid -> [messages]

function addStatus(msg) {
    const sender = msg.key.participant;
    if (!sender) return;

    if (!statuses.has(sender)) {
        statuses.set(sender, []);
    }

    statuses.get(sender).push({
        msg,
        timestamp: Date.now(),
    });
}

function getStatuses(jid) {
    const list = statuses.get(jid) || [];
    // auto-expire after 24h
    const now = Date.now();
    return list
        .filter(s => now - s.timestamp < 24 * 60 * 60 * 1000)
        .map(s => s.msg);
}

module.exports = {
    addStatus,
    getStatuses,
};
