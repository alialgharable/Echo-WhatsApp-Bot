module.exports = {
  name: 'restart',
  description: 'Restart the bot',
  ownerOnly: true,

  run: async ({ sock, msg }) => {
    await sock.sendMessage(msg.key.remoteJid, {
      text: '♻️ Restarting bot...'
    })

    setTimeout(() => {
      process.exit(0)
    }, 1000)
  }
}
