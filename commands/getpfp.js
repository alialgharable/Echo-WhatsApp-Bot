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

        const input = args[0]; // number or LID

        try {
            const store = sock.signalRepository?.lidMapping;

            let waId;

            // Try to get WhatsApp ID from LID mapping
            if (store) {
                const pn = await store.getPNForLID(input);
                if (pn) {
                    waId = pn;
                }
            }

            // Fallback: convert number to WhatsApp ID
            if (!waId) {
                const number = input.replace(/\D/g, "");
                waId = number + "@s.whatsapp.net";
            }

            const pfpUrl = await sock.profilePictureUrl(waId, "image");


            if (!pfpUrl) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ No profile picture found for ${input}`,
                });
            }

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pfpUrl },
                caption: `📌 Profile picture of ${input}`,
            });

            await maybeAutoVoice(
                sock,
                msg.key.remoteJid,
                `Here is the profile picture of ${input}`,
                {
                    enabled: config.autovoice,
                    elevenlabs: config.elevenlabs,
                }
            );
        } catch (err) {
            console.error("GETPFP ERROR:", err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ Failed to fetch profile picture for ${input}.\nError: ${err.message}`,
            });
        }
    },
};
