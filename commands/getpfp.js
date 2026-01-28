const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");
const os = require("os");

const isTermux = /android/i.test(os.type());

module.exports = {
  name: "getpfp",
  description: "Fetch profile picture safely on Termux (~720p, no crash)",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .getpfp <number or participant>\nExample: .getpfp +96181053255`,
      });
    }

    const input = args[0];
    try {
      const store = sock.signalRepository?.lidMapping;
      let waId;

      if (store) {
        const pn = await store.getPNForLID(input);
        if (pn) waId = pn;
      }

      if (!waId) {
        const number = input.replace(/\D/g, "");
        waId = number + "@s.whatsapp.net";
      }

      // Medium quality PFP (~720p max)
      let pfpUrl;
      try {
        pfpUrl = await sock.profilePictureUrl(waId, { type: "image" });
      } catch {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ No profile picture found for ${input}`,
        });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: pfpUrl },
        caption: `📌 Profile picture of ${input}${isTermux ? " (Termux-safe)" : ""}`,
      });

      // Only enable auto-voice if NOT on Termux
      if (!isTermux) {
        await maybeAutoVoice(
          sock,
          msg.key.remoteJid,
          `Here is the profile picture of ${input}`,
          {
            enabled: config.autovoice,
            elevenlabs: config.elevenlabs,
          }
        );
      }
    } catch (err) {
      console.error("GETPFP ERROR:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Failed to fetch profile picture for ${input}.\nError: ${err.message}`,
      });
    }
  },
};
