// commands/games.js
const fs = require("fs");
const path = require("path");
const { prefix } = require("../helper_commands/settings");

module.exports = {
    name: "games",
    description: "Show all available game commands",
    ignoreGlobal: true,

    run: async ({ sock, msg }) => {
        const gamesPath = path.join(__dirname, "games");
        if (!fs.existsSync(gamesPath)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: "❌ No games folder found.",
            });
        }

        const files = fs.readdirSync(gamesPath).filter(f => f.endsWith(".js"));

        if (!files.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: "❌ No games available.",
            });
        }

        let text = `🎮 *Available Games*\n`;
        text += "━━━━━━━━━━━━━━━\n\n";

        for (const file of files) {
            const game = require(`./games/${file}`);
            text += `🔹 *${prefix}${game.name}*`;
            if (game.description) text += `\n   _${game.description}_`;
            text += "\n\n";
        }

        text += "━━━━━━━━━━━━━━━";

        await sock.sendMessage(msg.key.remoteJid, { text });
    },
};
