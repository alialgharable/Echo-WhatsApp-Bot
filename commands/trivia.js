// commands/trivia.js
const axios = require("axios")

// Global object to track active trivia sessions
// Make sure to initialize this somewhere in your bot main file:
// global.activeTrivia = {}
if (!global.activeTrivia) global.activeTrivia = {}

module.exports = {
    name: "trivia",
    description: "Start a competitive trivia game",

    run: async ({ sock, msg }) => {
        const chatId = msg.key.remoteJid

        if (global.activeTrivia[chatId]) {
            return sock.sendMessage(chatId, { text: "❌ A trivia session is already active in this chat." })
        }

        try {
            // Fetch random questions (5 questions, multiple choice)
            const response = await axios.get("https://opentdb.com/api.php?amount=5&type=multiple")
            const questions = response.data.results.map(q => {
                // Shuffle answers
                const allAnswers = [...q.incorrect_answers, q.correct_answer]
                const shuffled = allAnswers.sort(() => Math.random() - 0.5)
                const correctIndex = shuffled.indexOf(q.correct_answer)

                return {
                    question: q.question,
                    options: shuffled,
                    correct: correctIndex
                }
            })

            // Initialize session
            global.activeTrivia[chatId] = {
                questionIndex: 0,
                questions,
                players: {}, // numericId -> { name, score }
                timer: null
            }

            await sock.sendMessage(chatId, { text: "🎮 Trivia Competition Started! Reply with `.answer <number>` (1-4) to participate!" })

            // Ask first question
            askQuestion(sock, chatId)

        } catch (e) {
            console.error("TRIVIA ERROR:", e)
            await sock.sendMessage(chatId, { text: "❌ Failed to start trivia." })
        }
    }
}

// Helper function to ask a question
async function askQuestion(sock, chatId) {
    const session = global.activeTrivia[chatId]
    if (!session) return

    const q = session.questions[session.questionIndex]
    const optionsText = q.options.map((o, i) => `${i + 1}) ${o}`).join("\n")

    await sock.sendMessage(chatId, {
        text: `🎯 Question ${session.questionIndex + 1}:\n${q.question}\n\n${optionsText}\n\nYou have 20 seconds to answer!`
    })

    // Start 20-second timer
    session.timer = setTimeout(async () => {
        await sock.sendMessage(chatId, {
            text: `⏰ Time's up! Correct answer: ${q.correct + 1}) ${q.options[q.correct]}`
        })

        session.questionIndex++

        if (session.questionIndex < session.questions.length) {
            askQuestion(sock, chatId)
        } else {
            // End game
            announceWinner(sock, chatId)
        }
    }, 20000) // 20 seconds
}

// Function to handle answers (call this from your message handler)
module.exports.handleAnswer = async ({ sock, msg, args }) => {
    const chatId = msg.key.remoteJid
    const numericId = parseInt(msg.key.participant.replace(/\D/g, ""), 10)
    const name = msg.pushName || "Player"
    const session = global.activeTrivia[chatId]

    if (!session) return
    const q = session.questions[session.questionIndex]

    if (!args[0]) return
    const answer = parseInt(args[0], 10) - 1
    if (isNaN(answer) || answer < 0 || answer > 3) return

    // Add player if new
    if (!session.players[numericId]) session.players[numericId] = { name, score: 0 }

    // Only first answer counts
    if (session.players[numericId].answered) return

    session.players[numericId].answered = true

    if (answer === q.correct) {
        session.players[numericId].score++
        await sock.sendMessage(chatId, { text: `✅ ${name} answered correctly!` })
    } else {
        await sock.sendMessage(chatId, { text: `❌ ${name} answered incorrectly.` })
    }
}

// Announce winner
async function announceWinner(sock, chatId) {
    const session = global.activeTrivia[chatId]
    if (!session) return

    const leaderboard = Object.entries(session.players)
        .sort(([, a], [, b]) => b.score - a.score)
        .map(([, p], idx) => `${idx + 1}. ${p.name} - ${p.score} pts`)
        .join("\n")

    await sock.sendMessage(chatId, {
        text: `🏁 Trivia Competition Ended!\n\n🏆 Final Leaderboard:\n${leaderboard}`
    })

    // Clean up
    clearTimeout(session.timer)
    delete global.activeTrivia[chatId]
}
