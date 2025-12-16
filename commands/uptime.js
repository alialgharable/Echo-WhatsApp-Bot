module.exports = {
    name: 'uptime',
    description: 'Show how long the bot has been running',

    run: async ({ sock, msg }) => {
        const uptimeSeconds = process.uptime()

        const seconds = Math.floor(uptimeSeconds % 60)
        const minutes = Math.floor((uptimeSeconds / 60) % 60)
        const hours = Math.floor((uptimeSeconds / 3600) % 24)
        const days = Math.floor(uptimeSeconds / 86400)

        const uptime =
            `${days}d ${hours}h ${minutes}m ${seconds}s`

        await sock.sendMessage(msg.key.remoteJid, {
            text: `⏱ Uptime: ${uptime}`
        })
    }
}
