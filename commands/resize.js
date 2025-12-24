const { exec } = require("child_process");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, "..", "bin", winName);
    if (process.platform === "win32" && fs.existsSync(local)) {
        return local;
    }
    return unixName;
}

const FFMPEG = resolveBinary("ffmpeg.exe", "ffmpeg");

module.exports = {
    name: "resize",
    description: "Resize an image",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted?.imageMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an image with `.resize <w> <h>`"
            });
        }

        const width = parseInt(args[0]);
        const height = parseInt(args[1]);

        if (!width || !height) {
            return sock.sendMessage(jid, {
                text: "❌ Usage: `.resize <width> <height>`\nExample: `.resize 512 512`"
            });
        }

        const tempDir = path.join(__dirname, "../temp");
        fs.mkdirSync(tempDir, { recursive: true });

        const id = crypto.randomBytes(5).toString("hex");
        const input = path.join(tempDir, `resize-in-${id}.jpg`);
        const output = path.join(tempDir, `resize-out-${id}.jpg`);

        try {
            const stream = await downloadContentFromMessage(
                quoted.imageMessage,
                "image"
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            fs.writeFileSync(input, buffer);

            await new Promise((res, rej) => {
                exec(
                    `"${FFMPEG}" -y -i "${input}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease" "${output}"`,
                    err => err ? rej(err) : res()
                );
            });

            await sock.sendMessage(jid, {
                image: fs.readFileSync(output)
            });

        } catch (e) {
            console.error("RESIZE ERROR:", e);
            await sock.sendMessage(jid, {
                text: "❌ Failed to resize image"
            });
        } finally {
            [input, output].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
        }
    }
};
