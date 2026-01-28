const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

module.exports = {
  name: "story",
  description: "Fetch the story/status of a WhatsApp number (supports index)",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .story <number or participant> [index]\nExample: .story +96181053255 0`,
      });
    }

    const lid = args[0]; // LID or number
    const index = args[1] ? parseInt(args[1], 10) : 0;

    try {
      const store = sock.signalRepository?.lidMapping;
      if (!store) throw new Error("Signal store not found");

      const pn = await store.getPNForLID(lid); // WhatsApp ID like 96181053255@s.whatsapp.net
      if (!pn) throw new Error("Could not resolve WhatsApp ID");

      const waId = pn;

      // Fetch stories
      const stories = await sock.fetchStatus(waId);

      if (!stories || !stories.length) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ No stories found for ${args[0]}`,
        });
      }

      const selectedStory = stories[index] || stories[0];
      const remaining = stories.length - (index + 1);

      const caption =
        remaining > 0
          ? `📌 First story sent. There are still ${remaining} more story(s).`
          : `📌 Story sent. No more stories remaining.`;

      await sock.sendMessage(msg.key.remoteJid, {
        [selectedStory.isVideo ? "video" : "image"]: { url: selectedStory.url },
        caption,
      });

      await maybeAutoVoice(
        sock,
        msg.key.remoteJid,
        caption,
        {
          enabled: config.autovoice,
          elevenlabs: config.elevenlabs,
        }
      );
    } catch (err) {
      console.error("STORY ERROR:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Failed to fetch story for ${args[0]}.\nError: ${err.message}`,
      });
    }
  },
};
