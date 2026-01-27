module.exports = {
    config: {
        name: "ph",
        version: "1.1",
        author: "SiFu",
        countDown: 5,
        role: 0,
        description: {
            vi: "Tạo logo phong cách PornHub (chỉ hình ảnh).",
            en: "Create a PornHub style text logo (image only)."
        },
        category: "image",
        guide: {
            en: "   {pn} [text1] | [text2]\n   Example: {pn} porte | hobe"
        }
    },

    onStart: async function ({ args, message, event }) {
        const axios = require("axios");
        const fs = require("fs-extra");
        const path = require("path");

        // Argument parsing
        let text1, text2;
        const input = args.join(" ");
        
        if (!input) {
            return message.reply("Please provide text. Usage: /ph Text1 | Text2");
        }

        if (input.includes("|")) {
            const split = input.split("|");
            text1 = split[0].trim();
            text2 = split[1].trim();
        } else {
            const parts = input.split(" ");
            if (parts.length === 1) {
                text1 = parts[0];
                text2 = "Hub";
            } else {
                text2 = parts.pop();
                text1 = parts.join(" ");
            }
        }

        // No processing message sent here anymore

        try {
            const apiUrl = `https://sifuapi.vercel.app/image/pornhub?text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}`;
            const savePath = path.join(__dirname, "cache", `ph_${event.senderID}.png`);

            const response = await axios({
                method: "GET",
                url: apiUrl,
                responseType: "stream"
            });

            const writer = fs.createWriteStream(savePath);
            response.data.pipe(writer);

            writer.on("finish", async () => {
                // Send ONLY the attachment, no body text
                await message.reply({
                    attachment: fs.createReadStream(savePath)
                });

                // Cleanup cache file
                fs.unlinkSync(savePath);
            });

            writer.on("error", () => {
                message.reply("Failed to write image file.");
            });

        } catch (error) {
            console.error(error);
            message.reply("API is currently unreachable.");
        }
    }
};
