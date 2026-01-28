const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");
const statusStore = require("../helper_commands/statusStore");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "story",
    description: "Fetch WhatsApp story/status safely",

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: .story <number> [index]\nExample: .story +961xxxxxxxx`,
            });
        }

        try {
            const number = args[0].replace(/\D/g, "");
            const index = args[1] ? parseInt(args[1], 10) : 0;
            const jid = number + "@s.whatsapp.net";

            // Get stories from the live store
            const stories = statusStore.getStatuses(jid);

            if (!stories.length) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ No stories available for ${number}`,
                });
            }

            const selected = stories[index] || stories[0];
            const remaining = stories.length - (index + 1);

            // Handle ephemeral messages
            const msgContent =
                selected.message?.imageMessage
                    ? selected.message
                    : selected.message?.videoMessage
                        ? selected.message
                        : selected.message?.ephemeralMessage?.message?.imageMessage
                            ? selected.message.ephemeralMessage.message
                            : selected.message?.ephemeralMessage?.message?.videoMessage
                                ? selected.message.ephemeralMessage.message
                                : null;

            if (!msgContent) {
                // Check for text-only story
                const textStory =
                    selected.message?.conversation ||
                    selected.message?.ephemeralMessage?.message?.conversation;
                if (textStory) {
                    const caption =
                        remaining > 0
                            ? `📌 Text story: "${textStory}"\n${remaining} more remaining.`
                            : `📌 Text story: "${textStory}"\nNo more stories remaining.`;
                    await sock.sendMessage(msg.key.remoteJid, { text: caption });
                    await maybeAutoVoice(sock, msg.key.remoteJid, caption, {
                        enabled: config.autovoice,
                        elevenlabs: config.elevenlabs,
                    });
                    return;
                }

                return sock.sendMessage(msg.key.remoteJid, {
                    text: "⚠️ Unsupported story type.",
                });
            }

            let contentType;
            let tempFile = path.join(
                __dirname,
                `../temp/story-${Date.now()}${msgContent.imageMessage ? ".jpg" : ".mp4"}`
            );

            // Download the media
            if (msgContent.imageMessage) {
                contentType = "image";
                const stream = await downloadContentFromMessage(msgContent.imageMessage, "image");
                const buffer = [];
                for await (const chunk of stream) buffer.push(chunk);
                fs.writeFileSync(tempFile, Buffer.concat(buffer));
            } else if (msgContent.videoMessage) {
                contentType = "video";
                const stream = await downloadContentFromMessage(msgContent.videoMessage, "video");
                const buffer = [];
                for await (const chunk of stream) buffer.push(chunk);
                fs.writeFileSync(tempFile, Buffer.concat(buffer));
            }

            const caption =
                remaining > 0
                    ? `📌 Story sent. ${remaining} more remaining.`
                    : `📌 Story sent. No more stories remaining.`;

            // Send downloaded story
            await sock.sendMessage(msg.key.remoteJid, {
                [contentType]: { url: tempFile },
                caption,
            });

            // Auto-voice (optional)
            await maybeAutoVoice(sock, msg.key.remoteJid, caption, {
                enabled: config.autovoice,
                elevenlabs: config.elevenlabs,
            });

            // Delete temp file
            fs.unlinkSync(tempFile);
        } catch (err) {
            console.error("STORY ERROR:", err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ Failed to fetch story for ${args[0]}.\nError: ${err.message}`,
            });
        }
    },
};
