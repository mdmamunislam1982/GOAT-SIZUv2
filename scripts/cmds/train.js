const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "train",
    version: "1.2",
    author: "SiFu",
    countDown: 5,
    role: 0,
    shortDescription: "Train image meme generator",
    longDescription: "Applies Thomas the Train filter to the mentioned, replied, or your own avatar",
    category: "fun",
    guide: {
      vi: "{pn} [@tag | reply | blank]",
      en: "{pn} [@tag | reply | blank]"
    }
  },

  onStart: async function ({ event, message, api }) {
    try {
      let targetID;

      // 1️⃣ মেনশন চেক করা (Tag)
      const mentions = Object.keys(event.mentions || {});
      if (mentions.length > 0) {
        targetID = mentions[0];
      }
      // 2️⃣ রিপ্লাই চেক করা (Reply)
      else if (event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      }
      // 3️⃣ কিছু না থাকলে যে কমান্ড দিছে তার নিজের আইডি (Self)
      else {
        targetID = event.senderID;
      }

      // 🔹 প্রোফাইল পিকচারের ডাইরেক্ট লিংক (Graph API)
      const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // ছবি ডাউনলোড এবং বাফার তৈরি
      const response = await axios.get(avatarURL, { responseType: "arraybuffer" });
      const imgBuffer = Buffer.from(response.data, "utf-8");

      // DIG লাইব্রেরি দিয়ে থমাস ফিল্টার অ্যাপ্লাই
      const img = await new DIG.Thomas().getImage(imgBuffer);

      // ফাইল সেভ করার পাথ
      const cacheDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const pathSave = path.join(cacheDir, `${targetID}_Thomas.png`);

      fs.writeFileSync(pathSave, Buffer.from(img));

      // মেসেজ পাঠানো এবং পাঠানোর পর ফাইল ডিলিট করা
      return message.reply({
        body: "Choo-choo! 🚂",
        attachment: fs.createReadStream(pathSave)
      }, () => {
        if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
      });

    } catch (error) {
      console.error(error);
      message.reply("❌ ছবি প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন!");
    }
  }
};
