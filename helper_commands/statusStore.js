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

// Get statuses for a user, auto-expire after 24h
function getStatuses(jid) {
  const list = statuses.get(jid) || [];
  const now = Date.now();
  const filtered = list.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000);
  statuses.set(jid, filtered);
  return filtered.map(s => s.msg);
}

module.exports = { addStatus, getStatuses };
