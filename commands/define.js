// commands/define.js
const axios = require("axios")

module.exports = {
    name: "define",
    description: "Find definition and synonyms of a word",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid
        const word = args.join(" ")

        if (!word) {
            return sock.sendMessage(jid, {
                text: "❌ Usage: `.define <word>`"
            })
        }

        try {
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
            const data = response.data[0]

            // Extract definitions
            const definitions = data.meanings.map(meaning => {
                const defs = meaning.definitions.map(d => `- ${d.definition}`).join("\n")
                return `*${meaning.partOfSpeech}*:\n${defs}`
            }).join("\n\n")

            // Extract synonyms if available
            let synonyms = []
            data.meanings.forEach(meaning => {
                meaning.definitions.forEach(def => {
                    if (def.synonyms) synonyms.push(...def.synonyms)
                })
            })
            synonyms = [...new Set(synonyms)].join(", ") || "None found"

            const msgText = `📚 *Word:* ${data.word}\n\n${definitions}\n\n💡 *Synonyms:* ${synonyms}`

            await sock.sendMessage(jid, { text: msgText })

        } catch (e) {
            console.error("DEFINE ERROR:", e)
            await sock.sendMessage(jid, {
                text: `❌ Could not find definition for "${word}"`
            })
        }
    }
}
