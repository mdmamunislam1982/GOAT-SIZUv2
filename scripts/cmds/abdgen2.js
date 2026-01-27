const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "abd2",
    aliases: [],
    author: "SiFu",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate an image using Abdgenv2 API.",
    longDescription: "Generates an image directly from the binary response of the Abdgenv2 API and sends it to the chat.",
    category: "img gen",
    guide: "Use the command to generate a default image or specify a custom prompt.",
  },
  onStart: async function ({ message, args, api, event }) {
    const prompt = args.join(" ") || "Default viral anime nature wallpaper";

    api.sendMessage("ᯓᡣ𐭩 Generating your img..ᐟ", event.threadID, event.messageID);

    try {
      // Payload for the Artbreeder API
      const payload = {
        job: {
          name: "multi-ipa-light",
          data: {
            seed: 0,
            prompt: prompt,
            guidance_scale: 1,
            width: 1024,
            height: 1024,
            num_inference_steps: 4,
            init_image: null,
            init_image_strength: 0.2,
            scribble_guidance_scale: 0,
            scribble_guidance_image: null,
            model_name: "sdxl-lightning",
            return_binary: true,
            image_format: "jpeg",
            ipa_data: [],
            negative_prompt: "",
            do_upres: false,
            do_upscale: false,
          },
          alias: "composer-image",
        },
        environment: null,
        browserToken: "VMUmmL9HIwgCeWcGzQdS",
      };

      // Make the POST request to the Artbreeder API
      const response = await axios.post("https://www.artbreeder.com/api/realTimeJobs", payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Origin: "https://artbreeder.com",
          Referer: "https://www.artbreeder.com/create/composer",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        },
        responseType: "arraybuffer", // Ensure binary response
      });

      // Save the binary data as an image
      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      const imagePath = path.join(cacheFolderPath, `generated_image_${Date.now()}.jpeg`);
      fs.writeFileSync(imagePath, response.data);

      // Create a stream for the saved image
      const stream = fs.createReadStream(imagePath);

      // Reply with the image
      message.reply({
        body: `꒷꒦︶꒷꒦꒷꒦︶꒷꒦๋꒷꒦`,
        attachment: stream,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      return api.sendMessage("❌ | An error occurred while generating the image. Please try again later.", event.threadID);
    }
  },
};