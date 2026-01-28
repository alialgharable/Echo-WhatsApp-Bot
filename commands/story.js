const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");
const statusStore = require("../helper_commands/statusStore");

module.exports = {
  name: "story",
  description: "Fetch WhatsApp story/status safely",

  run: async ({ sock, msg, args }) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Usage: .story <number> [index]\nExample: .story +96176616828 0`,
      });
    }

    const number = args[0].replace(/\D/g, "");
    const index = args[1] ? parseInt(args[1], 10) : 0;
    const jid = number + "@s.whatsapp.net";

    const stories = statusStore.getStatuses(jid);

    if (!stories.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: `⚠️ No stories available for ${number}`,
      });
    }

    const selected = stories[index] || stories[0];
    const remaining = stories.length - (index + 1);

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

    await maybeAutoVoice(sock, msg.key.remoteJid, caption, {
      enabled: config.autovoice,
      elevenlabs: config.elevenlabs,
    });
  },
};
