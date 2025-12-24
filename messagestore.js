const MAX_STORE = 500;
const store = new Map();


async function resolvePhoneFromMsg(sock, msg) {
    if (!msg || !msg.key) return null;

    const lid =
        msg.key.participant ||
        msg.key.remoteJid;

    if (!lid) return null;

    const lidStore = sock.signalRepository?.lidMapping;
    if (!lidStore) return null;

    const pn = await lidStore.getPNForLID(lid);
    return pn || null;
}

async function saveMessage(sock, msg, text, timestamp, pushName = "Unknown") {
    const phone = await resolvePhoneFromMsg(sock, msg);
    if (!phone) return;

    const groupJid = msg.key.remoteJid;

    if (!store.has(groupJid)) {
        store.set(groupJid, new Map());
    }

    const groupStore = store.get(groupJid);

    if (!groupStore.has(phone)) {
        groupStore.set(phone, []);
    }

    const arr = groupStore.get(phone);

    arr.push({
        sender: phone,
        text,
        time: timestamp,
        pushName
    });

    if (arr.length > MAX_STORE) {
        arr.splice(0, arr.length - MAX_STORE);
    }
}

function getLastMessages(groupJid, count) {
    if (!store.has(groupJid)) return [];

    const groupStore = store.get(groupJid);
    const allMessages = [];

    for (const messages of groupStore.values()) {
        allMessages.push(...messages);
    }

    return allMessages
        .sort((a, b) => a.time - b.time)
        .slice(-count);
}

function getUserMessages(groupJid, phone, count) {
    if (!store.has(groupJid)) return [];
    const groupStore = store.get(groupJid);
    if (!groupStore.has(phone)) return [];

    return groupStore.get(phone).slice(-count);
}

module.exports = {
    saveMessage,
    getLastMessages,
    getUserMessages,
    _getStore: () => store
};
