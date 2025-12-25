const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")

let puppeteer = null
try {
    puppeteer = require("puppeteer")
} catch { }

function isAndroid() {
    return process.platform === "android"
}

module.exports = {
    name: "ss",
    description: "Screenshot a website (Puppeteer with Termux fallback)",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: "❌ Usage:\n.ss <url>\n\nExample:\n.ss https://example.com"
            })
        }

        let url = args[0]
        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url
        }

        const tempDir = path.join(__dirname, "../temp")
        fs.mkdirSync(tempDir, { recursive: true })
        const output = path.join(tempDir, `ss_${Date.now()}.png`)

        if (!isAndroid() && puppeteer) {
            try {
                const browser = await puppeteer.launch({
                    headless: "new",
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu"
                    ]
                })

                const page = await browser.newPage()
                await page.setViewport({ width: 1280, height: 800 })

                await page.goto(url, {
                    waitUntil: "domcontentloaded",
                    timeout: 20000
                })

                await page.screenshot({ path: output })
                await browser.close()

                await sock.sendMessage(jid, {
                    image: fs.readFileSync(output),
                    caption: `📸 Screenshot (Puppeteer)\n${url}`
                })

                fs.unlinkSync(output)
                return
            } catch (e) {
                console.error("PUPPETEER FAILED, FALLING BACK:", e.message)
            }
        }


        try {
            await new Promise((res, rej) => {
                exec(
                    `wkhtmltoimage --width 1280 --disable-smart-width "${url}" "${output}"`,
                    { timeout: 30000 },
                    err => err ? rej(err) : res()
                )
            })

            if (!fs.existsSync(output)) {
                throw new Error("wkhtmltoimage failed")
            }

            await sock.sendMessage(jid, {
                image: fs.readFileSync(output),
                caption: `📸 Screenshot (fallback)\n${url}`
            })

        } catch (e) {
            await sock.sendMessage(jid, {
                text:
                    "❌ Could not screenshot this website.\n\n" +
                    "Possible reasons:\n" +
                    "- Heavy JavaScript / Cloudflare\n" +
                    "- Login required\n"
            })
        } finally {
            if (fs.existsSync(output)) fs.unlinkSync(output)
        }
    }
}
