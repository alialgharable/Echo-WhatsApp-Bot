// commands/quote.js
const axios = require("axios")

module.exports = {
    name: "quote",
    description: "Send a random quote",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid

        try {
            const response = await axios.get("https://api.quotable.io/random")
            const data = response.data

            const quoteText = `💬 "${data.content}"\n\n— ${data.author}`

            await sock.sendMessage(jid, { text: quoteText })

        } catch (e) {
            console.error("QUOTE ERROR:", e)
            await sock.sendMessage(jid, {
                text: "❌ Failed to fetch a quote"
            })
        }
    }
}
