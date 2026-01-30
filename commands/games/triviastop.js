module.exports = {
    name: "triviastop",
    description: "Stop the active trivia",

    run: async ({ sock, msg }) => {
        const chatId = msg.key.remoteJid
        const session = global.activeTrivia?.[chatId]

        if (!session) {
            return sock.sendMessage(chatId, {
                text: "❌ No trivia is running."
            })
        }

        clearTimeout(session.timer)
        delete global.activeTrivia[chatId]

        await sock.sendMessage(chatId, {
            text: "🛑 Trivia stopped."
        })
    }
}
