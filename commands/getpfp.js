const config = require("../config");

module.exports = {
    name: "getpfp",
    description: "Download the profile picture of a WhatsApp number",

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: .getpfp <number or participant>\nExample: .getpfp +961xxxxxxxx`,
            });
        }

        const input = args[0]; // number or LID

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

            // This function throws an error if the picture is not accessible
            const pfpUrl = await sock.profilePictureUrl(waId, "image");
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: pfpUrl },
                caption: `📌 Profile picture of ${input}`,
            });

        } catch (err) {
            console.error("GETPFP ERROR:", err);

            // Check for specific error messages from Baileys
            if (err.message.includes("404") || err.message.includes("not-authorized") || err.message.includes("bad-request")) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ No profile picture found for ${input} or it is set to private.`,
                });
            } else {
                // Handle any other unexpected errors
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `⚠️ Failed to fetch profile picture.\nError: ${err.message}`,
                });
            }
        }
    },
};
