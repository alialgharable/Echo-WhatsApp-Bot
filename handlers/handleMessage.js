const fs = require("fs");
const path = require("path");
const triviaCmd = require("./commands/trivia.js")

const { globalOwnerOnly, globalGroupOnly, owners } = require("../config");
const { prefix } = require("../helper_commands/settings");
const { saveMessage, getLastMessages } = require("../messagestore");

const commands = {};

const commandFiles = fs.readdirSync(path.join(__dirname, "../commands"));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands[command.name] = command;
}

async function isOwner(sock, msg) {
  if (!msg || !msg.key) return false;
  if (msg.key.fromMe === true) return true;

  const lid =
    msg.key.participant ||
    msg.key.remoteJid;

  const store = sock.signalRepository?.lidMapping;
  if (!store) return false;

  const pn = await store.getPNForLID(lid);
  if (!pn) return false;

  return owners.includes(pn.split(":")[0]);
}

function isGroup(msg) {
  return msg.key.remoteJid.endsWith("@g.us");
}

function getText(msg) {
  if (!msg.message) return null;
  const m = msg.message;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.ephemeralMessage?.message) {
    return getText({ message: m.ephemeralMessage.message });
  }
  if (m.viewOnceMessage?.message) {
    return getText({ message: m.viewOnceMessage.message });
  }
  return null;
}

module.exports = async (sock, msg) => {
  if (!msg || !msg.key) return;
  if (msg.key.remoteJid === "status@broadcast") return;

  const text = getText(msg);
  if (!text) return;

  const ts =
    msg.messageTimestamp?.low ??
    msg.messageTimestamp;

  if (ts && !text.startsWith(prefix)) {
    await saveMessage(
      sock,
      msg,
      text,
      ts,
      msg.pushName
    );
  }

  const lid =
    msg.key.participant || msg.key.remoteJid;

  const phone =
    await sock.signalRepository?.lidMapping?.getPNForLID(lid);

  if (phone) {
    const messages = getLastMessages(msg.key.remoteJid, 500);

    console.log(messages);
  }

  if (!text.startsWith(prefix)) return;

  const args = text.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = commands[commandName];
  if (!command) return;

  if (!command.ignoreGlobal) {
    if (globalOwnerOnly && !(await isOwner(sock, msg))) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Commands are restricted to bot owners.",
      });
    }

    if (globalGroupOnly && !isGroup(msg)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Commands can only be used in groups.",
      });
    }
  }

  if (command.ownerOnly && !(await isOwner(sock, msg))) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ This command is owner-only.",
    });
  }

  if (command.groupOnly && !isGroup(msg)) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ This command can only be used in groups.",
    });
  }


  if (text.startsWith(".trivia")) {
    triviaCmd.run({ sock, msg, args })
  }

  if (text.startsWith(".answer")) {
    triviaCmd.handleAnswer({ sock, msg, args })
  }


  try {
    await command.run({ sock, msg, args });
  } catch (err) {
    console.error("COMMAND ERROR:", err);
  }
};
