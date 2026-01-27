const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
    config: {
        name: "text",
        version: "2.0",
        author: "SiFu",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Generate an image from text with random or specific colors" },
        longDescription: { en: "Creates a clean image using text. If no color is provided, it picks a random one." },
        category: "fun",
        guide: { en: "{pn} [text] or {pn} [text] [color]" }
    },

    onStart: async function ({ message, args }) {
        if (args.length === 0)
            return message.reply("❗ Please provide some text. Example: `text Hello World` or `text Hello red` ");

        // Common color names list
        const colorNames = ["black","white","red","green","blue","yellow","gray","orange","purple","pink","brown","cyan","magenta","lime","navy","teal"];
        
        let bgColor;
        let textArgs;

        const lastArg = args[args.length - 1].toLowerCase();
        const hexMatch = lastArg.match(/^#?([0-9a-f]{6})$/i);

        // Check if the user provided a color at the end
        if (hexMatch || colorNames.includes(lastArg)) {
            bgColor = hexMatch ? hexMatch[1].replace('#', '') : lastArg;
            textArgs = args.slice(0, -1);
        } else {
            // Random Hex Color Generator
            bgColor = Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            textArgs = args;
        }

        if (textArgs.length === 0) textArgs = [args[args.length - 1]]; // In case text is the color itself

        const text = encodeURIComponent(textArgs.join(" "));
        
        // Advanced: Randomizing dimensions slightly for variety (600x400 to 800x400)
        const widths = [600, 700, 800];
        const randomWidth = widths[Math.floor(Math.random() * widths.length)];
        
        // Auto Text Color: White for dark backgrounds, Black for light backgrounds
        // Using fff (white) for simplicity, or you can randomize this too
        const textColor = "fff"; 

        const imageUrl = `https://dummyimage.com/${randomWidth}x400/${bgColor}/${textColor}&text=${text}`;
        const filePath = path.join(__dirname, "cache", `text_${Date.now()}.png`);

        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            await fs.outputFile(filePath, Buffer.from(response.data));

            // Reply only with the attachment (no text body)
            return message.reply({
                attachment: fs.createReadStream(filePath)
            }, () => fs.unlinkSync(filePath)); // Cache delete after sending

        } catch (e) {
            console.error(e);
            message.reply("⚠️ Error generating image.");
        }
    }
};
