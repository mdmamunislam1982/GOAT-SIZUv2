const axios = require("axios");

module.exports = {
  config: {
    name: "momoi",
    aliases: ["mmi"],
    version: "1.2",
    author: "SiFu",
    shortDescription: "Generate audio using momoi voice",
    longDescription: "Send text or reply to a message 🐍",
    category: "momoi",
    guide: "{p}omaigotto <text> or reply to a message with {p}omaigotto",
  },

  onStart: async function ({ api, event, message, args }) {
    try {
      const text = args.join(" ") || event.messageReply?.body;
      if (!text) return message.reply("ദ്ദി◝ ⩊ ◜.ᐟ\n\n provide some text..!");

      // Safely set reaction (ignore errors)
      try {
        api.setMessageReaction("🧪", event.messageID, () => {}, true);
      } catch (_) {}

      const audioUrl = `https://egret-driving-cattle.ngrok-free.app/api/omg?txt=${encodeURIComponent(text)}`;

      const response = await axios({
        url: audioUrl,
        method: "GET",
        responseType: "stream"
      });

      await message.reply({
        body: `𖡼𖤣𖥧𖡼𓋼𖤣𖥧𓋼𓍊`,
        attachment: response.data,
      });

      try {
        api.setMessageReaction("🎀", event.messageID, () => {}, true);
      } catch (_) {}

    } catch (error) {
      console.error("omaigotto error:", error);
      try {
        api.setMessageReaction("😓", event.messageID, () => {}, true);
      } catch (_) {}
      return message.reply("≽^• ˕ • ྀི≼ \n\n Failed to generate audio");
    }
  },
};