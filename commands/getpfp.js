const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");

function parseNumber(input) {
    return input.replace(/\D/g, "");
}

module.exports = {
    name: "getpfp",
    description: "Download the profile picture of a WhatsApp number",

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: .getpfp <number>\nExample: .getpfp +96181053255`,
            });
        }

        const number = parseNumber(args[0]);

        try {
            const pfpUrl = await sock.profilePictureUrl(number);

            if (!pfpUrl) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ No profile picture found for ${args[0]}`,
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pfpUrl },
                caption: `📌 Profile picture of ${args[0]}`,
            });
        } catch (err) {
            console.error("GETPFP ERROR:", err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ Failed to fetch profile picture for ${args[0]}.\nError: ${err.message}`,
            });
        }
    },
};
