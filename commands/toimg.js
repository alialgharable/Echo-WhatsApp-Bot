const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
    name: "toimg",
    description: "Convert a sticker to an image",

    run: async ({ sock, msg }) => {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;

        if (!ctx?.quotedMessage?.stickerMessage) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: "❌ Reply to a sticker with `.toimg`"
            });
        }

        const mediaMsg = {
            key: {
                remoteJid: msg.key.remoteJid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: ctx.quotedMessage
        };

        const tempDir = path.join(__dirname, "../temp");
        fs.mkdirSync(tempDir, { recursive: true });

        const webp = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const png = path.join(tempDir, `sticker_${Date.now()}.png`);

        try {
            const buffer = await downloadMediaMessage(
                mediaMsg,
                "buffer",
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            fs.writeFileSync(webp, buffer);

            await new Promise((res, rej) => {
                exec(`ffmpeg -y -i "${webp}" "${png}"`, err =>
                    err ? rej(err) : res()
                );
            });

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    image: fs.readFileSync(png),
                    caption: "🖼️ Sticker converted to image"
                },
                { quoted: msg }
            );

        } catch (err) {
            console.error("TOIMG ERROR:", err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ Failed to convert sticker to image"
            });
        } finally {
            [webp, png].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
        }
    }
};
