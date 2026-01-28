const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");
const axios = require("axios");

module.exports = {
    name: "getpfp",
    description: "Download the profile picture of a WhatsApp number in high quality",

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

            // Fetch high-quality PFP
            let pfpUrl;
            try {
                // full: true requests the highest available resolution
                pfpUrl = await sock.profilePictureUrl(waId, { type: "image", full: true });
            } catch {
                // fallback to default
                pfpUrl = await sock.profilePictureUrl(waId);
            }

            if (!pfpUrl) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ No profile picture found for ${input}`,
                });
            }

            // Download the image into memory to avoid WhatsApp compression
            const response = await axios.get(pfpUrl, { responseType: "arraybuffer" });
            const buffer = Buffer.from(response.data, "binary");

            await sock.sendMessage(msg.key.remoteJid, {
                image: buffer,
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
