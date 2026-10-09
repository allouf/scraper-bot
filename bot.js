const { Telegraf } = require('telegraf');
const Jimp = require('jimp'); // Importing Jimp
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
require('dotenv').config(); // Load environment variables from .env file

// Create a new Telegraf bot using the token from the environment variable
const bot = new Telegraf(process.env.BOT_TOKEN);

// Create a directory for stickers if it doesn't exist
const stickersDir = path.join(__dirname, 'stickers');
if (!fs.existsSync(stickersDir)) {
    fs.mkdirSync(stickersDir);
}

// Function to create frames for the sticker animation
async function createFrames(text) {
    const frames = [];
    const width = 512;
    const height = 512;

    for (let i = 0; i < 10; i++) { // Create 10 frames
        const image = new Jimp(width, height, 0x00000000); // Transparent background
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        
        // Print the text with a slight variation for each frame
        image.print(font, 0, 0, {
            text: text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, width, height);

        // Save each frame
        const framePath = path.join(stickersDir, `frame_${i}.png`);
        await image.writeAsync(framePath);
        frames.push(framePath);
    }

    return frames;
}

// Function to convert frames to .tgs using puppeteer and lottie-web
async function convertToTgs(frames, outputFileName) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(`
        <html>
        <body>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.7.14/lottie.min.js"></script>
            <script>
                (async () => {
                    const frames = ${JSON.stringify(frames)};
                    const animationData = {
                        v: "5.5.7",
                        fr: 60,
                        ip: 0,
                        op: 60,
                        w: 512,
                        h: 512,
                        nm: "sample animation",
                        ddd: 0,
                        assets: [],
                        layers: []
                    };

                    for (let i = 0; i < frames.length; i++) {
                        animationData.layers.push({
                            ddd: 0,
                            ind: i + 1,
                            ty: 2,
                            nm: "frame " + i,
                            refId: "image_" + i,
                            sr: 1,
                            ks: {
                                o: { a: 0, k: 100, ix: 11 },
                                r: { a: 0, k: 0, ix: 10 },
                                p: { a: 0, k: [256, 256, 0], ix: 2, l: 2 },
                                a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
                                s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
                            },
                            ao: 0,
                            ip: i * 6,
                            op: (i + 1) * 6,
                            st: 0,
                            bm: 0,
                        });

                        animationData.assets.push({
                            id: "image_" + i,
                            w: 512,
                            h: 512,
                            u: "",
                            p: frames[i],
                            e: 0,
                        });
                    }

                    // Save the animation data as a JSON file
                    const fs = require('fs');
                    fs.writeFileSync('${path.join(stickersDir, outputFileName)}.json', JSON.stringify(animationData));

                    // Create the TGS file
                    const animation = bodymovin.loadAnimation({
                        container: document.createElement('div'),
                        animationData: animationData,
                        renderer: 'svg',
                        loop: false,
                        autoplay: false
                    });

                    const tgsData = animation.toLottie();
                    fs.writeFileSync('${path.join(stickersDir, outputFileName)}', JSON.stringify(tgsData));
                })();
            </script>
        </body>
        </html>
    `);

    await page.waitForTimeout(3000);
    await browser.close();
}

// Command to generate an animated sticker
bot.command('generate_sticker', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) {
        return ctx.reply('Please provide text for the sticker. Usage: /generate_sticker <text>');
    }

    try {
        const frames = await createFrames(text);
        const outputFileName = `${text.replace(/[^a-zA-Z0-9]/g, '_')}.tgs`; // Sanitize the filename
        await convertToTgs(frames, outputFileName);
        await ctx.replyWithSticker({ source: path.join(stickersDir, outputFileName) });
    } catch (error) {
        console.error("Error generating sticker:", error);
        ctx.reply('An error occurred while generating the sticker.');
    }
});

// Launch the bot
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch(err => {
    console.error('Failed to launch bot:', err);
});

// Handle graceful shutdown
process.once('SIGINT', () => {
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
});
