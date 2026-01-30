// commands/quote.js
const axios = require("axios")

module.exports = {
    name: "quote",
    description: "Send a random quote",

    run: async ({ sock, msg }) => {
        const jid = msg.key.remoteJid

        try {
            const res = await axios.get("https://zenquotes.io/api/random")
            const data = res.data[0]

            const quoteText = `💬 "${data.q}"\n\n— ${data.a}`

            await sock.sendMessage(jid, { text: quoteText })

        } catch (e) {
            console.error("QUOTE ERROR:", e)
            await sock.sendMessage(jid, {
                text: "❌ Quote service is currently unavailable."
            })
        }
    }
}
