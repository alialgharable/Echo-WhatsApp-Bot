const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getLastMessages } = require("../messagestore");
const { maybeAutoVoice } = require("../utils/maybeAutoVoice");
const config = require("../config");
const settings = require("../helper_commands/settings");

module.exports = {
  name: "summary",
  description: "Summarize recent group conversation",
  groupOnly: true,

  run: async ({ sock, msg }) => {
    const groupJid = msg.key.remoteJid;

    const messages = getLastMessages(groupJid, 200);

    if (!messages.length || messages.length < 5) {
      return sock.sendMessage(groupJid, {
        text: "❌ Not enough messages to summarize yet.",
      });
    }

    const conversation = messages
      .map(m => `${m.pushName}: ${m.text}`)
      .join("\n");

    const prompt = `
You are Echo, a WhatsApp group assistant bot.

Summarize the following group conversation.

Rules:
- Refer to users by their names (e.g. "Ali says...", "John mentions...")
- Do NOT invent names
- Do NOT include phone numbers or IDs
- Do NOT include timestamps
- Keep the summary concise and clear

Conversation:
${conversation}

Summary:
`.trim();

    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      await sock.sendMessage(groupJid, {
        text: `📝 *Group Summary*\n\n${summary}`,
      });

      await maybeAutoVoice(sock, groupJid, summary);
    } catch (err) {
      console.error("SUMMARY ERROR:", err);

      await sock.sendMessage(groupJid, {
        text: "❌ Failed to generate summary.",
      });
    }
  },
};
