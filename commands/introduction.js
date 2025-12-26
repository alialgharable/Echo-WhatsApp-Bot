const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const gTTS = require("gtts");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const config = require("../config");
const { botName } = require("../helper_commands/settings");
const HelpCommand = require("./help");

function resolveBinary(winName, unixName) {
  const local = path.join(__dirname, "..", "bin", winName);
  if (process.platform === "win32" && fs.existsSync(local)) {
    return local;
  }
  return unixName;
}

const FFMPEG = resolveBinary("ffmpeg.exe", "ffmpeg");

function cleanText(text) {
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/[*_~`>|#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function googleTTS(text, out) {
  const gtts = new gTTS(text, "en");
  await new Promise((res, rej) => {
    gtts.save(out, (err) => (err ? rej(err) : res()));
  });
}

async function elevenLabsTTS(text, out) {
  const client = new ElevenLabsClient({
    apiKey: config.elevenlabs.apiKey,
  });

  const stream = await client.textToSpeech.convert(
    config.elevenlabs.voiceId,
    {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    }
  );

  const w = fs.createWriteStream(out);
  stream.pipe(w);

  await new Promise((res, rej) => {
    w.on("finish", res);
    w.on("error", rej);
  });
}

module.exports = {
  name: "introduction",
  description: `${botName} Introduction message`,

  run: async ({ sock, msg }) => {
    const jid = msg.key.remoteJid;

    const text = `Hello. I’m ${botName}.
Your personal WhatsApp assistant.
I help you download media, manage groups, and automate tasks.
Let’s get started.`.trim();

    await sock.sendMessage(jid, { text });

    const tempDir = path.join(__dirname, "../temp");
    fs.mkdirSync(tempDir, { recursive: true });

    const cachedVoice = path.join(__dirname, "../assets/voice.mp3");
    const tempVoice = path.join(tempDir, "voice_tmp.mp3");
    const finalOpus = path.join(tempDir, "intro_final.opus");

    const intro = path.join(__dirname, "../assets/intro.mp3");
    const bed = path.join(__dirname, "../assets/bed_loop.mp3");
    const outro = path.join(__dirname, "../assets/outro.mp3");

    try {
      // =========================
      // 1. Generate voice ONCE
      // =========================
      if (!fs.existsSync(cachedVoice)) {
        const clean = cleanText(text);

        if (config.elevenlabs?.apiKey) {
          try {
            await elevenLabsTTS(clean, tempVoice);
          } catch {
            await googleTTS(clean, tempVoice);
          }
        } else {
          await googleTTS(clean, tempVoice);
        }

        fs.renameSync(tempVoice, cachedVoice);
      }

      // =========================
      // 2. Assemble final audio
      // =========================
      const cmd = `
"${FFMPEG}" -y \
-i "${intro}" \
-i "${cachedVoice}" \
-stream_loop -1 -i "${bed}" \
-i "${outro}" \
-filter_complex "
[1:a][2:a]amix=inputs=2:weights=1 0.2:dropout_transition=0[voicebed];
[0:a]apad=pad_dur=0.5[intro_pad];
[voicebed]apad=pad_dur=1.0[voice_pad];
[intro_pad][voice_pad][3:a]concat=n=3:v=0:a=1[out]
" \
-map "[out]" \
-ac 1 -ar 48000 -c:a libopus "${finalOpus}"
      `;

      await new Promise((res, rej) => {
        exec(cmd, (err) => (err ? rej(err) : res()));
      });

      await sock.sendMessage(jid, {
        audio: fs.readFileSync(finalOpus),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      });

      HelpCommand.run({ sock, msg });

    } catch (err) {
      console.error("INTRODUCTION VOICE ERROR:", err);
      await sock.sendMessage(jid, {
        text: "❌ Failed to generate introduction voice.",
      });
    } finally {
      if (fs.existsSync(tempVoice)) fs.unlinkSync(tempVoice);
      if (fs.existsSync(finalOpus)) fs.unlinkSync(finalOpus);
    }
  },
};
