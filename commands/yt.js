const { exec } = require("child_process")
const yts = require("yt-search")
const fs = require("fs")
const path = require("path")

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, "..", "bin", winName)
    if (process.platform === "win32" && fs.existsSync(local)) {
        return local
    }
    return unixName
}

const YTDLP = resolveBinary("yt-dlp.exe", "yt-dlp")

module.exports = {
    name: "yt",
    description: "Download YouTube video",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid

        if (!args.length) {
            return sock.sendMessage(jid, {
                text:
                    "❌ Usage:\n" +
                    ".yt <link | search> [quality]\n" +
                    "Examples:\n" +
                    ".yt cats\n" +
                    ".yt cats 480\n" +
                    ".yt https://youtu.be/... 1080"
            })
        }

        let quality = 720
        if (/^\d{3,4}$/.test(args[args.length - 1])) {
            quality = parseInt(args.pop())
        }

        let query = args.join(" ")
        let url = query
        let title = "YouTube video"

        // 🔍 Search if not a link
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const search = await yts(query)
            if (!search.videos.length) {
                return sock.sendMessage(jid, { text: "❌ No results found." })
            }

            const video = search.videos[0]
            url = video.url
            title = video.title
        } else {
            const info = await yts(url)
            if (info?.videos?.length) {
                title = info.videos[0].title
            }
        }

        const tempDir = path.join(__dirname, "../temp")
        fs.mkdirSync(tempDir, { recursive: true })

        const baseName = `yt_${Date.now()}`
        const filePath = path.join(tempDir, `${baseName}.mp4`)

        const formatSelector = `bv*[height<=${quality}]+ba/b`

        await sock.sendMessage(jid, {
            text: "🎥 Downloading video..."
        })

        const cmd =
            `"${YTDLP}" ` +
            `-f "${formatSelector}" ` +
            `--merge-output-format mp4 ` +
            `--no-playlist ` +
            `--no-live-from-start ` +
            `-o "${filePath}" ` +
            `"${url}"`

        exec(
            cmd,
            {
                windowsHide: true,
                timeout: 1000 * 60 * 5,
                maxBuffer: 1024 * 1024 * 50
            },
            async (err, stdout, stderr) => {

                console.log("YT-DLP STDOUT:\n", stdout)
                console.log("YT-DLP STDERR:\n", stderr)

                if (err || !fs.existsSync(filePath)) {
                    console.error("YT ERROR:", err)
                    return sock.sendMessage(jid, {
                        text: "❌ Download failed."
                    })
                }

                const sizeMB = fs.statSync(filePath).size / 1024 / 1024
                const caption = `🎬 ${title}\n📺 ${quality}p`

                try {
                    if (sizeMB <= 15) {
                        await sock.sendMessage(jid, {
                            video: fs.readFileSync(filePath),
                            caption
                        })
                    } else {
                        await sock.sendMessage(jid, {
                            document: fs.readFileSync(filePath),
                            mimetype: "video/mp4",
                            fileName: `youtube-${quality}p.mp4`,
                            caption
                        })
                    }
                } catch (sendErr) {
                    console.error("SEND ERROR:", sendErr)
                    await sock.sendMessage(jid, {
                        text: "❌ Failed to send video."
                    })
                } finally {
                    try {
                        fs.unlinkSync(filePath)
                    } catch { }
                }
            }
        )
    }
}
