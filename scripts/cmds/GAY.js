const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const DIG = require("discord-image-generation");

module.exports = {
  config: {
    name: "gay",
    version: "2.4",
    author: "SIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "Find who's gay 😆",
    longDescription: "Applies a rainbow gay filter to the mentioned or replied user's avatar",
    category: "fun",
    guide: {
      en: "{pn} @mention or reply to a message\n\nYou must mention someone or reply to their message."
    }
  },

  onStart: async function ({ api, event, message }) {
    try {
      let targetID;

      // Check for mention
      const mentions = Object.keys(event.mentions || {});
      if (mentions.length > 0) {
        targetID = mentions[0];
      }

      // Check if message is a reply
      if (!targetID && event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      }

      // If no target, use sender's ID (Self check)
      if (!targetID) {
        targetID = event.senderID;
      }

      // FIX: Facebook URL 
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // Get User Name
      const userInfo = await api.getUserInfo(targetID);
      const name = userInfo[targetID].name;

      const imagePath = await applyGayFilter(avatarUrl);

      const attachment = fs.createReadStream(imagePath);
      await message.reply({
        body: `🏳️‍🌈 Look! I found a gay: ${name} 😜`,
        attachment
      });

      // Cleanup
      fs.unlinkSync(imagePath);

    } catch (error) {
      console.error(error);
      message.reply("❌ Something went wrong while processing the image.");
    }
  }
};

// 🏳️‍🌈 Function to apply gay filter
async function applyGayFilter(avatarUrl) {
  try {
    // 👇 Fetching the image as a buffer
    const response = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "utf-8"); 

    const gayFilter = new DIG.Gay();
    // DIG accepts buffer directly
    const filteredImage = await gayFilter.getImage(imageBuffer);

    const outputDir = path.join(__dirname, "cache");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    
    const outputFile = path.join(outputDir, `gay_${Date.now()}.png`);
    fs.writeFileSync(outputFile, filteredImage);

    return outputFile;
  } catch (err) {
    throw new Error(err);
  }
}