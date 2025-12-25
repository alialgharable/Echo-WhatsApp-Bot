const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
    name: "stickerbg",
    description: "Convert image to sticker (keep background, fast)",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo

        if (!ctx?.quotedMessage?.imageMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an image with `.stickerbg`"
            })
        }

        const mediaMsg = {
            key: {
                remoteJid: jid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: ctx.quotedMessage
        }

        const tempDir = path.join(__dirname, "../temp")
        fs.mkdirSync(tempDir, { recursive: true })

        const input = path.join(tempDir, `img_${Date.now()}.jpg`)
        const output = path.join(tempDir, `sticker_${Date.now()}.webp`)

        try {
            const imgBuffer = await downloadMediaMessage(
                mediaMsg,
                "buffer",
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            fs.writeFileSync(input, imgBuffer)

            await new Promise((res, rej) => {
                exec(
                    `ffmpeg -y -i "${input}" ` +
                    `-vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15" ` +
                    `-an -vsync 0 "${output}"`,
                    { windowsHide: true },
                    err => err ? rej(err) : res()
                )
            })

            if (!fs.existsSync(output)) {
                throw new Error("Sticker conversion failed")
            }

            await sock.sendMessage(jid, {
                sticker: fs.readFileSync(output)
            })

        } catch (err) {
            console.error("STICKERBG ERROR:", err)
            await sock.sendMessage(jid, {
                text: `❌ Sticker error:\n\n${err.toString().slice(0, 3000)}`
            })
        } finally {
            if (fs.existsSync(input)) fs.unlinkSync(input)
            if (fs.existsSync(output)) fs.unlinkSync(output)
        }
    }
}
