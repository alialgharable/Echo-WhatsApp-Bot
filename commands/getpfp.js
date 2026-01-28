const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

module.exports = {
  name: "getpfp",
  description: "Download the profile picture of a WhatsApp number",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .getpfp <number or participant>\nExample: .getpfp +96181053255`,
      });
    }

    const lid = args[0]; // LID or number

    try {
      const store = sock.signalRepository?.lidMapping;
      if (!store) throw new Error("Signal store not found");

      const pn = await store.getPNForLID(lid); // WhatsApp ID like 96181053255@s.whatsapp.net
      if (!pn) throw new Error("Could not resolve WhatsApp ID");

      const waId = pn;

      const pfpUrl = await sock.profilePictureUrl(waId);

      if (!pfpUrl) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ No profile picture found for ${args[0]}`,
        });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: pfpUrl },
        caption: `📌 Profile picture of ${args[0]}`,
      });

      await maybeAutoVoice(
        sock,
        msg.key.remoteJid,
        `Here is the profile picture of ${args[0]}`,
        {
          enabled: config.autovoice,
          elevenlabs: config.elevenlabs,
        }
      );
    } catch (err) {
      console.error("GETPFP ERROR:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Failed to fetch profile picture for ${args[0]}.\nError: ${err.message}`,
      });
    }
  },
};
