const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");
const os = require("os");

const isTermux = /android/i.test(os.type());

module.exports = {
  name: "story",
  description: "Fetch WhatsApp story/status safely on Termux (~720p)",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .story <number or participant> [index]\nExample: .story +96181053255 0`,
      });
    }

    const input = args[0];
    const index = args[1] ? parseInt(args[1], 10) : 0;

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

      const stories = await sock.fetchStatus(waId);
      if (!stories || !stories.length) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ No stories found for ${input}`,
        });
      }

      const selectedStory = stories[index] || stories[0];
      const remaining = stories.length - (index + 1);
      const caption =
        remaining > 0
          ? `📌 Story sent (~720p). ${remaining} more remaining.`
          : `📌 Story sent (~720p). No more stories remaining.`;

      // Send by URL directly to avoid Termux crash
      await sock.sendMessage(msg.key.remoteJid, {
        [selectedStory.isVideo ? "video" : "image"]: { url: selectedStory.url },
        caption,
      });

      // Only enable auto-voice if NOT on Termux
      if (!isTermux) {
        await maybeAutoVoice(sock, msg.key.remoteJid, caption, {
          enabled: config.autovoice,
          elevenlabs: config.elevenlabs,
        });
      }
    } catch (err) {
      console.error("STORY ERROR:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ Failed to fetch story for ${input}.\nError: ${err.message}`,
      });
    }
  },
};
