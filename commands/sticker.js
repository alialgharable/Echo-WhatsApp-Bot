const sharp = require('sharp')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = {
    name: 'sticker',
    description: 'Convert image to sticker',

    run: async ({ sock, msg }) => {
        const ctx = msg.message?.extendedTextMessage?.contextInfo
        if (!ctx?.quotedMessage?.imageMessage) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Reply to an image with `.sticker`'
            })
        }

        const mediaMsg = {
            key: {
                remoteJid: msg.key.remoteJid,
                fromMe: false,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: ctx.quotedMessage
        }

        try {
            // 1️⃣ Download image
            const imgBuffer = await downloadMediaMessage(
                mediaMsg,
                'buffer',
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            // 2️⃣ Convert to WEBP (VALID sticker)
            const webpBuffer = await sharp(imgBuffer)
                .resize(512, 512, { fit: 'contain' })
                .webp({ quality: 80 })
                .toBuffer()

            // 3️⃣ Send sticker
            await sock.sendMessage(msg.key.remoteJid, {
                sticker: webpBuffer
            })

        } catch (err) {
            console.error('STICKER ERROR:', err)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Failed to create sticker'
            })
        }
    }
}
