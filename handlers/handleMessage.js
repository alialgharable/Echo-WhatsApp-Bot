const fs = require('fs')
const path = require('path')
const { prefix, globalOwnerOnly, globalGroupOnly, owner } = require('../config')

const commands = {}

const commandFiles = fs.readdirSync(
    path.join(__dirname, '../commands')
)

for (const file of commandFiles) {
    const command = require(`../commands/${file}`)
    commands[command.name] = command
}

function normalizeJid(jid) {
    return jid?.split('@')[0].split(':')[0]
}

function isOwner(msg) {
    if (msg.key.fromMe === true) return true

    const senderJid = msg.key.participant || msg.key.remoteJid
    if (!senderJid) return false

    const senderNumber = normalizeJid(senderJid)
    return senderNumber === owner
}

function isGroup(msg) {
    return msg.key.remoteJid.endsWith('@g.us')
}

module.exports = async (sock, msg) => {
    
    const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text

    if (!text) return
    if (!text.startsWith(prefix)) return

    const args = text.slice(prefix.length).trim().split(/\s+/)
    const commandName = args.shift().toLowerCase()

    const command = commands[commandName]
    if (!command) return

    if (!command.ignoreGlobal) {
        if (globalOwnerOnly === true && !isOwner(msg)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Commands are restricted to the bot owner.'
            })
        }

        if (globalGroupOnly === true && !isGroup(msg)) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Commands can only be used in groups.'
            })
        }
    }

    if (command.ownerOnly && !isOwner(msg)) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: '❌ This command is owner-only.'
        })
    }

    if (command.groupOnly && !isGroup(msg)) {
        return sock.sendMessage(msg.key.remoteJid, {
            text: '❌ This command can only be used in groups.'
        })
    }

    try {
        await command.run({ sock, msg, args })
    } catch (err) {
        console.error('COMMAND ERROR:', err)
    }
}
