const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

module.exports = {
  name: "statustest",
  description: "Fetch the WhatsApp 'About / status' text of a number",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .status <number>\nExample: .status +961xxxxxxxx`,
      });
    }

    const input = args[0];
    const number = input.replace(/\D/g, "");
    const jid = number + "@s.whatsapp.net";

    try {
      const statusData = await sock.fetchStatus(jid);

      if (!statusData || !statusData.status) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ No status text available for ${input}`,
        });
      }

      const reply = `📌 Status of ${input}:\n\n"${statusData.status}"`;

      await sock.sendMessage(msg.key.remoteJid, {
        text: reply,
      });

      // Optional: auto-voice
      await maybeAutoVoice(sock, msg.key.remoteJid, reply, {
        enabled: config.autovoice,
        elevenlabs: config.elevenlabs,
      });
    } catch (err) {
      console.error("STATUS ERROR:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Failed to fetch status for ${input}.\nError: ${err.message}`,
      });
    }
  },
};
