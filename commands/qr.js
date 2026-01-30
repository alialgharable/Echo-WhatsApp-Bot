// commands/qr.js
const QRCode = require("qrcode")

module.exports = {
    name: "qr",
    description: "Convert text or link to QR code",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid
        const text = args.join(" ")

        if (!text) {
            return sock.sendMessage(jid, {
                text: "❌ Usage: `.qr <link or text>`"
            })
        }

        try {
            const qrBuffer = await QRCode.toBuffer(text, {
                type: "png",
                width: 512,
                errorCorrectionLevel: "H"
            })

            await sock.sendMessage(jid, {
                image: qrBuffer,
                caption: `🔲 QR Code for:\n${text}`
            })

        } catch (e) {
            console.error("QR ERROR:", e)
            sock.sendMessage(jid, {
                text: "❌ Failed to generate QR code"
            })
        }
    }
}
