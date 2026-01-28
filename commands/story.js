const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

function parseNumber(input) {
    return input.replace(/\D/g, "");
}

module.exports = {
    name: "story",
    description: "Fetch the story/status of a WhatsApp number (supports index)",

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: .story <number> [index]\nExample: .story +96181053255 0`,
            });
            return;
        }

        const number = parseNumber(args[0]);
        const index = args[1] ? parseInt(args[1], 10) : 0;

        try {
            // Fetch the statuses/stories of the number
            const stories = await sock.fetchStatus(number);

            if (!stories || !stories.length) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ No stories found for ${args[0]}`,
                });
            }

            const selectedStory = stories[index] || stories[0];
            const remaining = stories.length - (index + 1);

            // Prepare caption
            const caption =
                remaining > 0
                    ? `📌 First story sent. There are still ${remaining} more story(s).`
                    : `📌 Story sent. No more stories remaining.`;

            // Send the story
            await sock.sendMessage(msg.key.remoteJid, {
                [selectedStory.isVideo ? "video" : "image"]: { url: selectedStory.url },
                caption,
            });

            // Auto-voice output
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
                text: `⚠️ Failed to fetch stories for ${args[0]}.\nError: ${err.message}`,
            });
        }
    },
};
