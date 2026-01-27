const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fire",
    aliases: ["burn"],
    version: "1.3.0",
    author: "SiFu",
    countDown: 5,
    role: 0,
    shortDescription: "Burn meme image",
    longDescription: "SpongeBob burn meme using user avatar",
    category: "fun"
  },

  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let uid;
    if (event.type === "message_reply") {
      uid = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else {
      uid = event.senderID;
    }

    // অল্টারনেটিভ প্রোফাইল পিকচার লিংক
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    try {
      // সাকসেসফুলি ইমেজ জেনারেট করার ট্রাই
      const res = await axios.get(
        `https://sifuapi.vercel.app/canvas/burn?avatar=${encodeURIComponent(avatarUrl)}`,
        { responseType: "arraybuffer" }
      );

      const imgPath = path.join(cacheDir, `burn_${uid}.png`);
      fs.writeFileSync(imgPath, Buffer.from(res.data, "utf-8"));

      return api.sendMessage(
        { attachment: fs.createReadStream(imgPath) },
        event.threadID,
        () => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); },
        event.messageID
      );

    } catch (err) {
      console.error(err);
      // যদি সিফু এপিআই কাজ না করে তবে এরর মেসেজ দিবে
      return api.sendMessage("দুঃখিত, বর্তমানে ইমেজ সার্ভারটি কাজ করছে না। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।", event.threadID);
    }
  }
};