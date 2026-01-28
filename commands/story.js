const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

module.exports = {
  name: "story",
  description: "Fetch WhatsApp story/status safely",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .story <number> [index]\nExample: .story +96176616828 0`,
      });
    }

    const input = args[0];
    const index = args[1] ? parseInt(args[1], 10) : 0;

    try {
      // Normalize number
      const number = input.replace(/\D/g, "");
      const targetJid = number + "@s.whatsapp.net";

      // Fetch ALL statuses
      const statusData = await sock.fetchStatus("status@broadcast");

      if (!statusData || !statusData.messages?.length) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "⚠️ No stories available.",
        });
      }

      // Filter stories by sender
      const userStories = statusData.messages.filter(
        m => m.key?.participant === targetJid
      );

      if (!userStories.length) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: `⚠️ No stories found for ${input}`,
        });
      }

      const selected = userStories[index] || userStories[0];
      const remaining = userStories.length - (index + 1);

      const content =
        selected.message?.imageMessage
          ? { image: { url: selected.message.imageMessage.url } }
          : selected.message?.videoMessage
          ? { video: { url: selected.message.videoMessage.url } }
          : null;

      if (!content) {
        return sock.sendMessage(msg.key.remoteJid, {
          text: "⚠️ Unsupported story type.",
        });
      }

      const caption =
        remaining > 0
          ? `📌 Story sent. ${remaining} more remaining.`
          : `📌 Story sent. No more stories remaining.`;

      await sock.sendMessage(msg.key.remoteJid, {
        ...content,
        caption,
      });

      // Auto-voice (safe)
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
        text: `⚠️ Failed to fetch story for ${input}.\nError: ${err.message}`,
      });
    }
  },
};
