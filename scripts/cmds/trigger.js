const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "trigger",
    version: "1.2",
    author: "SiFu",
    countDown: 5,
    role: 0,
    shortDescription: "Triggered GIF meme",
    longDescription: "Applies a triggered shaking GIF effect to the mentioned, replied, or your own avatar",
    category: "fun",
    guide: {
      vi: "{pn} [@tag | reply | để trống]",
      en: "{pn} [@tag | reply | empty]"
    }
  },

  onStart: async function ({ event, message }) {
    try {
      let targetID;

      // 1️⃣ Tag/Mention চেক
      const mentions = Object.keys(event.mentions || {});
      if (mentions.length > 0) {
        targetID = mentions[0];
      }
      // 2️⃣ Message Reply চেক
      else if (event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      }
      // 3️⃣ কিছু না থাকলে নিজের আইডি (Self)
      else {
        targetID = event.senderID;
      }

      // 🔹 Graph API ব্যবহার করে প্রোফাইল পিকচার লোড করা (Fix for blank image)
      const avatarURL = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      // ছবি ডাউনলোড করে বাফারে নেওয়া
      const response = await axios.get(avatarURL, { responseType: "arraybuffer" });
      const imgBuffer = Buffer.from(response.data, "utf-8");

      // Triggered GIF তৈরি
      const img = await new DIG.Triggered().getImage(imgBuffer);

      // ফাইল সেভ করার লোকেশন ঠিক করা
      const cacheDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const pathSave = path.join(cacheDir, `${targetID}_Trigger.gif`);

      fs.writeFileSync(pathSave, Buffer.from(img));

      // রিপ্লাই পাঠানো এবং ফাইল ক্লিনআপ
      return message.reply({
        body: "💢 Triggered!!!",
        attachment: fs.createReadStream(pathSave)
      }, () => {
        if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
      });

    } catch (error) {
      console.error(error);
      message.reply("❌ GIF তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন!");
    }
  }
};