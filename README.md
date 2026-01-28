![Echo Bot](./assets/readme-image.webp)

# Echo — Personal WhatsApp Bot

> A modular, permission-aware WhatsApp bot built with **Node.js** and **Baileys** for learning, experimentation, and private use.

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-private-lightgrey)

---

## Overview

Echo is a clean and extensible WhatsApp bot designed to be easy to understand, configure, and extend. It features a modular command system, fine‑grained permission controls, and safe media handling.

- Commands are triggered using a configurable prefix (default: `.`)
- Works in **private chats** and **groups** (based on configuration)
- Built for stability and maintainability, not mass deployment

---

## Purpose

This project is intended for:

- Personal use
- Learning and experimentation
- Exploring WhatsApp automation with Baileys

It is **not** intended for public hosting, commercial use, or large‑scale deployments.

---

## Features

### Command System

- Prefix‑based command handling
- Modular command files
- Easy to add, remove, or modify commands

### Permissions

- Owner‑only commands
- Group‑only commands
- Per‑command permission configuration

### Stickers

- Convert images into valid WhatsApp stickers
- Save stickers and reuse them later

### Stability & Safety

- Centralized message handler
- Safe asynchronous execution
- Robust error handling to prevent crashes
- Designed to tolerate WhatsApp Web media limitations

---

## Commands

Below are example commands. Actual availability may depend on configuration and permissions.

| Command      | Description                   | Scope      |
| ------------ | ----------------------------- | ---------- |
| `.help`      | Show available commands       | All chats  |
| `.sticker`   | Convert an image to a sticker | All chats  |
| `.setprefix` | Change the command prefix     | Owner only |
| `.setname`   | Change the bot name           | Owner only |
| `.stop`      | Safely shut down the bot      | Owner only |

> You can easily add new commands by creating a new command file in the commands directory.

---

## Configuration

### `config.js`

Contains core configuration such as:

- Owners
- Group behavior
- Feature toggles

### `settings.json`

Stores runtime‑editable settings:

- Bot name
- Command prefix

These can also be modified using in‑chat commands:

- `setprefix`
- `setname`

---

## Installation & Usage

### Requirements

- Node.js **18+**
- Windows

### Steps

1. Install dependencies:

   ```bash
   installDependencies.bat
   ```

2. Create the `.env` file:

   ```bash
   create-env.ps1
   ```

   Follow the instructions shown in the `.env` file.

3. Start the bot:

   ```bash
   run.bat
   ```

4. Scan the QR code with WhatsApp (first run only)

5. Stop the bot safely using:

   ```text
   .stop
   ```

---

## Notes & Limitations

- Media handling depends on WhatsApp Web behavior
- Some images may be blocked by WhatsApp servers
- Not optimized for public bots or high‑traffic usage
- Use at your own risk

---

## Disclaimer

This project is for **educational and experimental purposes only**. The author is not responsible for account bans or misuse.

---

## Contributing

This is a personal project, but improvements and ideas are welcome. Feel free to fork and experiment.

---

**Echo** — simple, modular, and built for learning.
