const trivia = require("./trivia.js");

module.exports = {
    name: "answer",
    description: "Answer the current trivia question",

    run: async ({ sock, msg, args }) => {
        if (!args[0]) return sock.sendMessage(msg.key.remoteJid, {
            text: "❌ Usage: .answer <1-4>"
        });

        await trivia.handleAnswer({ sock, msg, args });
    }
};
