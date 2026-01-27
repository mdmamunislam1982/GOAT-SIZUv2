const axios = require("axios");

module.exports = {
  config: {
    name: "kawaii",
    aliases: [],
    version: "1.0",
    author: "sifu",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Send a random kawaii anime girl",
    },
    longDescription: {
      en: "This command sends a random kawaii (cute) anime girl image from an API.",
    },
    category: "anime",
    guide: {
      en: "{p}kawaii",
    },
  },

  onStart: async function ({ api, event }) {
    try {
      // Example API that gives cute anime girl images
      const response = await axios.get("https://nekos.life/api/v2/img/neko");

      const imageUrl = response.data.url;
      api.sendMessage(
        {
          body: "Here's a anime girl for you 💖",
          attachment: await global.utils.getStreamFromURL(imageUrl),
        },
        event.threadID,
        event.messageID
      );
    } catch (error) {
      api.sendMessage("❌ Failed to fetch kawaii image. Try again later.", event.threadID, event.messageID);
      console.error("Kawaii.js error:", error);
    }
  },
};
