const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const YTDLP = resolveBinary('yt-dlp.exe', 'yt-dlp')
const FFMPEG = resolveBinary('ffmpeg.exe', 'ffmpeg')

function resolveBinary(winName, unixName) {
    const winLocal = path.join(__dirname, '..', 'bin', winName)
    if (process.platform === 'win32' && fs.existsSync(winLocal)) {
        return winLocal
    }
    return unixName
}

function formatError(err, stderr) {
    return (
        '❌ *Song download failed*\n\n' +
        '🧨 Error:\n' +
        '```' +
        (err?.message || err?.toString() || 'Unknown error').slice(0, 1000) +
        '```\n\n' +
        '📄 yt-dlp stderr:\n' +
        '```' +
        (stderr || 'No stderr output').slice(0, 1500) +
        '```'
    )
}

module.exports = {
    name: 'song',
    description: 'Search and download a song as MP3',

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: '❌ Usage: .song <song name>'
            })
        }

        const query = args.join(' ')
        const baseName = `song_${Date.now()}`
        const tmpDir = path.join(__dirname, '../tmp')
        const outputTemplate = path.join(tmpDir, `${baseName}.%(ext)s`)

        fs.mkdirSync(tmpDir, { recursive: true })

        await sock.sendMessage(jid, {
            text: '🎵 Searching and downloading...'
        })

        const isWin = process.platform === 'win32'
        const ytdlpCmd = isWin ? `"${YTDLP}"` : YTDLP

        const cmd =
            `${ytdlpCmd} -x --audio-format mp3 ` +
            `--audio-quality 0 ` +
            `--no-playlist ` +
            `--default-search ytsearch1 ` +
            `-o "${outputTemplate}" ` +
            `"${query}"`

        exec(
            cmd,
            {
                windowsHide: true,
                timeout: 1000 * 60 * 3,
                maxBuffer: 1024 * 1024 * 20
            },
            async (err, stdout, stderr) => {

                console.log('YT-DLP STDOUT:\n', stdout)
                console.log('YT-DLP STDERR:\n', stderr)

                if (err) {
                    console.error('SONG ERROR:', err)

                    return sock.sendMessage(jid, {
                        text: formatError(err, stderr)
                    })
                }

                const files = fs.readdirSync(tmpDir)
                const mp3File = files.find(
                    f => f.startsWith(baseName) && f.endsWith('.mp3')
                )

                if (!mp3File) {
                    return sock.sendMessage(jid, {
                        text: '❌ MP3 file not generated.'
                    })
                }

                const fullPath = path.join(tmpDir, mp3File)

                try {
                    await sock.sendMessage(
                        jid,
                        {
                            audio: { url: fullPath },
                            mimetype: 'audio/mpeg'
                        },
                        { quoted: msg }
                    )
                } catch (sendErr) {
                    console.error('SEND AUDIO ERROR:', sendErr)

                    await sock.sendMessage(jid, {
                        text:
                            '❌ Failed to send audio.\n\n' +
                            '```' +
                            (sendErr.message || sendErr.toString()).slice(0, 1500) +
                            '```'
                    })
                } finally {
                    try {
                        fs.unlinkSync(fullPath)
                    } catch {}
                }
            }
        )
    }
}
