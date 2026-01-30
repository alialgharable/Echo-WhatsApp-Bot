// commands/trivia.js
const axios = require("axios")

if (!global.activeTrivia) global.activeTrivia = {}

module.exports = {
    name: "trivia",
    description: "Start a competitive trivia game",

    run: async ({ sock, msg }) => {
        const chatId = msg.key.remoteJid

        if (global.activeTrivia[chatId]) {
            return sock.sendMessage(chatId, { text: "❌ A trivia session is already active." })
        }

        try {
            const res = await axios.get("https://opentdb.com/api.php?amount=5&type=multiple")

            const questions = res.data.results.map(q => {
                const answers = [...q.incorrect_answers, q.correct_answer]
                answers.sort(() => Math.random() - 0.5)

                return {
                    question: q.question,
                    options: answers,
                    correct: answers.indexOf(q.correct_answer)
                }
            })

            global.activeTrivia[chatId] = {
                index: 0,
                questions,
                players: {},
                timer: null
            }

            await sock.sendMessage(chatId, {
                text: "🎮 Trivia started!\nAnswer with `.answer <1-4>`"
            })

            askQuestion(sock, chatId)

        } catch (err) {
            console.error(err)
            sock.sendMessage(chatId, { text: "❌ Failed to fetch trivia." })
        }
    }
}

// ─────────────────────────────

async function askQuestion(sock, chatId) {
    const session = global.activeTrivia[chatId]
    if (!session) return

    // reset answered flags
    Object.values(session.players).forEach(p => p.answered = false)

    const q = session.questions[session.index]
    const opts = q.options.map((o, i) => `${i + 1}) ${o}`).join("\n")

    await sock.sendMessage(chatId, {
        text: `🎯 Question ${session.index + 1}\n\n${q.question}\n\n${opts}\n\n⏱️ 20 seconds`
    })

    session.timer = setTimeout(async () => {
        await sock.sendMessage(chatId, {
            text: `⏰ Time's up!\nCorrect answer: ${q.correct + 1}) ${q.options[q.correct]}`
        })

        nextQuestion(sock, chatId)
    }, 20000)
}

// ─────────────────────────────

module.exports.handleAnswer = async ({ sock, msg, args }) => {
    const chatId = msg.key.remoteJid
    const session = global.activeTrivia[chatId]
    if (!session) return

    const answer = parseInt(args[0], 10) - 1
    if (isNaN(answer) || answer < 0 || answer > 3) return

    const uid = msg.key.participant || msg.key.remoteJid
    const name = msg.pushName || "Player"

    if (!session.players[uid]) {
        session.players[uid] = { name, score: 0, answered: false }
    }

    const player = session.players[uid]
    if (player.answered) return

    player.answered = true

    const q = session.questions[session.index]

    if (answer === q.correct) {
        player.score++
        clearTimeout(session.timer)

        await sock.sendMessage(chatId, {
            text: `✅ ${name} is correct! (+1 point)`
        })

        nextQuestion(sock, chatId)
    }
}

// ─────────────────────────────

async function nextQuestion(sock, chatId) {
    const session = global.activeTrivia[chatId]
    if (!session) return

    session.index++

    if (session.index < session.questions.length) {
        askQuestion(sock, chatId)
    } else {
        endGame(sock, chatId)
    }
}

// ─────────────────────────────

async function endGame(sock, chatId) {
    const session = global.activeTrivia[chatId]
    if (!session) return

    const board = Object.values(session.players)
        .sort((a, b) => b.score - a.score)
        .map((p, i) => `${i + 1}. ${p.name} — ${p.score} pts`)
        .join("\n") || "No players"

    await sock.sendMessage(chatId, {
        text: `🏁 Trivia ended!\n\n🏆 Leaderboard:\n${board}`
    })

    clearTimeout(session.timer)
    delete global.activeTrivia[chatId]
}
