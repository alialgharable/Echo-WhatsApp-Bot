const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const YTDLP = `"C:\\Users\\ajali\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe"`
const FFMPEG = `"C:\\Users\\ajali\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe"`




module.exports = {
    name: 'song',
    description: 'Search and download a song as MP3',

    run: async ({ sock, msg, args }) => {
        if (!args.length) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Usage: .song <song name>'
            })
        }

        const query = args.join(' ')
        const baseName = `song_${Date.now()}`
        const tmpDir = path.join(__dirname, '../tmp')
        const outputTemplate = path.join(tmpDir, `${baseName}.%(ext)s`)

        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir)
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: '🎵 Searching and downloading...'
        })

        const cmd =
            `${YTDLP} -x --audio-format mp3 ` +
            `--ffmpeg-location ${FFMPEG} ` +
            `--audio-quality 0 ` +
            `--no-playlist ` +
            `--default-search ytsearch1 ` +
            `-o "${outputTemplate}" ` +
            `"${query}"`






        exec(cmd, { shell: 'cmd.exe', windowsHide: true }, async (err, stdout, stderr) => {
            console.log('YT-DLP STDOUT:\n', stdout)
            console.log('YT-DLP STDERR:\n', stderr)

            if (err) {
                console.error('SONG ERROR:', err)
                return sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to download song.'
                })
            }

            const files = fs.readdirSync(tmpDir)
            const mp3File = files.find(
                f => f.startsWith(baseName) && f.endsWith('.mp3')
            )

            if (!mp3File) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ MP3 file not generated.'
                })
            }

            const fullPath = path.join(tmpDir, mp3File)

            try {
                await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        audio: fs.readFileSync(fullPath),
                        mimetype: 'audio/mpeg'
                    },
                    { quoted: msg }
                )
            } catch (sendErr) {
                console.error('SEND AUDIO ERROR:', sendErr)
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '❌ Failed to send audio.'
                })
            } finally {
               
                try {
                    fs.unlinkSync(fullPath)
                    console.log('🧹 Deleted temp file:', mp3File)
                } catch (cleanupErr) {
                    console.error('CLEANUP ERROR:', cleanupErr)
                }
            }
        })

    }
}
