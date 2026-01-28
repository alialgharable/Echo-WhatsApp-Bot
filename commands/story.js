const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

module.exports = {
    name: "story",
    description: "Fetch WhatsApp story/status of a number (optimized for Termux)",

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: .story <number or participant> [index]\nExample: .story +96181053255 0`,
            });
        }

        const input = args[0]; // number or LID
        const index = args[1] ? parseInt(args[1], 10) : 0;

        try {
            const store = sock.signalRepository?.lidMapping;
            let waId;

            // Try LID mapping first
            if (store) {
                const pn = await store.getPNForLID(input);
                if (pn) waId = pn;
            }

            // Fallback: construct WhatsApp ID
            if (!waId) {
                const number = input.replace(/\D/g, "");
                waId = number + "@s.whatsapp.net";
            }

            // Fetch stories
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
                    ? `📌 Story sent. ${remaining} more remaining.`
                    : `📌 Story sent. No more stories remaining.`;

            // Send by URL directly to avoid memory crash
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
                text: `⚠️ Failed to fetch story for ${input}.\nError: ${err.message}`,
            });
        }
    },
};
