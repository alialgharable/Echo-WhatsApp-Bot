const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { exec } = require("child_process")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, "..", "bin", winName)
    if (process.platform === "win32" && fs.existsSync(local)) {
        return local
    }
    return unixName
}

const FFMPEG = resolveBinary("ffmpeg.exe", "ffmpeg")

module.exports = {
    name: "blur",
    description: "Blur an image using FFmpeg",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid
        const ctx = msg.message?.extendedTextMessage?.contextInfo
        const quoted = ctx?.quotedMessage

        if (!quoted?.imageMessage) {
            return sock.sendMessage(jid, {
                text: "❌ Reply to an image with `.blur`"
            })
        }

        const mediaMsg = {
            key: {
                remoteJid: jid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: quoted
        }

        const tempDir = path.join(__dirname, "../temp")
        fs.mkdirSync(tempDir, { recursive: true })

        const id = crypto.randomBytes(5).toString("hex")
        const inputPath = path.join(tempDir, `blur_in_${id}.png`)
        const outputPath = path.join(tempDir, `blur_out_${id}.jpg`)

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

            fs.writeFileSync(inputPath, imgBuffer)

            await new Promise((res, rej) => {
                exec(
                    `"${FFMPEG}" -y -i "${inputPath}" -vf "boxblur=10:1" "${outputPath}"`,
                    err => err ? rej(err) : res()
                )
            })

            await sock.sendMessage(jid, {
                image: fs.readFileSync(outputPath)
            })

            fs.unlinkSync(inputPath)
            fs.unlinkSync(outputPath)

        } catch (err) {
            console.error("BLUR ERROR:", err)
            await sock.sendMessage(jid, {
                text: "❌ Failed to blur image."
            })
        }
    }
}
