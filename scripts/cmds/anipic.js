const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "anipic",
    aliases: [],
    author: "SiFu",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: {
      en: ""
    },
    longDescription: {
      en: "Get a random anime picture"
    },
    category: "anime",
    guide: {
      en: ""
    }
  },

  onStart: async function ({ api, event }) {
    const filePath = path.join(__dirname, "cache", "anipic_image.png");
    const tid = event.threadID;
    const mid = event.messageID;

    try {
      const response = await axios.get("https://pic.re/image", { responseType: "stream" });

      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          { attachment: fs.createReadStream(filePath) },
          tid,
          () => {
            fs.unlink(filePath, (err) => {
              if (err) console.error("Failed to delete cached image:", err);
            });
          },
          mid
        );
      });

      writer.on("error", (err) => {
        console.error("Error writing image to file:", err);
        api.sendMessage("❌ Failed to save image. Please try again.", tid, mid);
      });

    } catch (error) {
      console.error("Error fetching image:", error);
      api.sendMessage("❌ Failed to fetch random anime picture. Please try again.", tid, mid);
    }
  }
};
