# scraper-bot — Telegram Animated Sticker Generator

A Telegram bot that turns text into animated stickers (`.tgs`): renders text into PNG frames with Jimp, then encodes them as Lottie/TGS animations via Puppeteer + lottie-web.

## How it works

1. User sends text to the bot
2. Bot renders 10 animation frames (512×512 transparent PNG) with Jimp
3. Frames are assembled into a Lottie animation inside a headless browser (Puppeteer + lottie-web) and exported as `.tgs`
4. The animated sticker is sent back to the user

## Tech Stack

- Node.js, Telegraf (Telegram Bot API)
- Jimp — image rendering
- Puppeteer + lottie-web — TGS encoding

## Getting Started

```bash
npm install
```

Create a `.env` file with your bot token:

```
BOT_TOKEN=123456:ABC-DEF...
```

Then run:

```bash
node bot.js
```

## Environment Variables

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot token from [@BotFather](https://t.me/BotFather) |
