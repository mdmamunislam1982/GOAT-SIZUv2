const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "sla",
    version: "1.2",
    author: "sifu",
    countDown: 5,
    role: 0,
    shortDescription: "Batman slap image meme",
    longDescription: "Batman slaps Robin meme using sender and target avatars",
    category: "fun",
    guide: {
      en: "{pn} @tag or reply to someone"
    }
  },

  onStart: async function ({ event, message, args }) {
    try {
      const uid1 = event.senderID;
      let uid2;

      // 1️⃣ Logic: Tag > Reply > Error
      if (Object.keys(event.mentions).length > 0) {
        uid2 = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        uid2 = event.messageReply.senderID;
      }

      if (!uid2) {
        return message.reply("❌ Please mention or reply to the person you want to slap! 🙂");
      }

      // 🔹 Fix: Using Graph API with Token for reliable images
      const avatarURL1 = `https://graph.facebook.com/${uid1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarURL2 = `https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // Fetch images as buffers
      const res1 = await axios.get(avatarURL1, { responseType: "arraybuffer" });
      const res2 = await axios.get(avatarURL2, { responseType: "arraybuffer" });

      // Generate Batslap image
      const img = await new DIG.Batslap().getImage(Buffer.from(res1.data), Buffer.from(res2.data));

      // Path and Save
      const cacheDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const pathSave = path.join(cacheDir, `batslap_${Date.now()}.png`);

      fs.writeFileSync(pathSave, Buffer.from(img));

      // Clean up mention from text if any extra message is provided
      const content = args.join(' ').replace(/@[^ ]+/g, "");

      return message.reply({
        body: `${(content || "Take this! 😡 👋")}`,
        attachment: fs.createReadStream(pathSave)
      }, () => {
        if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
      });

    } catch (error) {
      console.error(error);
      message.reply("❌ An error occurred while generating the slap image.");
    }
  }
};