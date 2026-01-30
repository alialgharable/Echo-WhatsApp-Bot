// commands/triviastats.js

module.exports = {
    name: "triviastats",
    description: "Show the leaderboard for the current trivia session",

    run: async ({ sock, msg }) => {
        const chatId = msg.key.remoteJid

        // Check if trivia session exists
        if (!global.activeTrivia || !global.activeTrivia[chatId]) {
            return sock.sendMessage(chatId, { text: "❌ No active trivia session in this chat." })
        }

        const session = global.activeTrivia[chatId]
        const players = session.players

        if (!players || Object.keys(players).length === 0) {
            return sock.sendMessage(chatId, { text: "❌ No players have answered yet." })
        }

        // Sort players by score descending
        const leaderboard = Object.entries(players)
            .sort(([, a], [, b]) => b.score - a.score)
            .map(([id, p], idx) => `${idx + 1}. ${p.name} - ${p.score} pts`)
            .join("\n")

        await sock.sendMessage(chatId, {
            text: `🏆 Trivia Leaderboard (Current Scores):\n\n${leaderboard}`
        })
    }
}
