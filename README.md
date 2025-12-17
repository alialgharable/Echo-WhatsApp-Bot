# Echo Your Personal WhatsApp Bot

Echo is your personal WhatsApp bot built with Node.js and Baileys, created for experimentation, learning, and private use.

It is designed to be easily configurable, and easy to add commands, with a clean command system, permission controls, and safe media handling.

Echo responds to messages prefixed with `.` and can be used in both private chats and groups, depending on configuration.

## Echo's Purpose

This project is intended for personal use and learning and experimental purposes

Features and structure are built to be clear and maintainable.

## Current Features

### Command System

Echo uses prefixed based commands to respond

Easy to add or remove commands

## Permissions

There are some commands which can be only used by the owners of the bot, or in groups only.

Commands can be configured to be only used by the owners of bot or in groups only.

## Stickers

Echo can convert images into valid WhatsApp stickers

Stickers can be saved and reused later

## Stability

Central message handler

Safe asynchronous execution

Careful error handling to prevent crashes

Designed to tolerate WhatsApp media limitations

## Configuration

All main behavior is controlled from config.js

## Running the Bot

1. Ensure that all dependencies are present: `npm install @whiskeysockets/baileys sharp qrcode-terminal dotenv @google/generative-ai`

2. Run the `index.js` file using `node index.js` in the terminal

3. Scan the QR code with WhatsApp to log in.

## Notes

Media handling depends on WhatsApp Web behavior

Some images may be blocked by WhatsApp servers

This bot is not optimized for public or large-scale use
