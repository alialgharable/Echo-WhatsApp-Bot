const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
    name: "stickerbg",
    description: "Convert image to sticker keeping the background",

    run: async ({ sock, msg }) => {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;

        if (!ctx?.quotedMessage?.imageMessage) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: "❌ Reply to an image with `.stickerbg`"
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

        const input = path.join(tempDir, `img_${Date.now()}.jpg`);
        const output = path.join(tempDir, `sticker_${Date.now()}.webp`);

        try {
            const imgBuffer = await downloadMediaMessage(
                mediaMsg,
                "buffer",
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            fs.writeFileSync(input, imgBuffer);

            await new Promise((res, rej) => {
                exec(
                    `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=transparent" -vcodec libwebp -lossless 0 -compression_level 6 -qscale 80 "${output}"`,
                    err => err ? rej(err) : res()
                );
            });

            await sock.sendMessage(msg.key.remoteJid, {
                sticker: fs.readFileSync(output)
            });

        } catch (err) {
            console.error("STICKERBG ERROR:", err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: "❌ Failed to create sticker"
            });
        } finally {
            [input, output].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
        }
    }
};
