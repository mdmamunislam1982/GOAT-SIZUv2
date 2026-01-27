const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const bgURL = "https://files.catbox.moe/20pg09.jpg";
const cachePath = path.join(__dirname, "cache");
const localBgPath = path.join(cachePath, "kiss_bg.jpg");

const avatarConfig = {
  boy: { x: 255, y: 50, size: 107 },
  girl: { x: 367, y: 160, size: 97 }
};

module.exports = {
  config: {
    name: "kiss",
    version: "2.1",
    author: "SiFu",
    countDown: 5,
    role: 0,
    description: "💋 Create a romantic kiss image between you and your tagged partner!",
    category: "love",
    guide: {
      en: "{pn} @tag or reply to someone's message"
    }
  },

  langs: {
    en: {
      noTag: "Please tag someone or reply to their message to use this command 💋"
    }
  },

  onStart: async function ({ event, message, usersData, api }) {
    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions)[0];

    if (!uid2 && event.messageReply?.senderID)
      uid2 = event.messageReply.senderID;

    if (!uid2)
      return message.reply(this.langs.en.noTag);

    const processing = await message.reply("🎀 Processing your kiss moment...");

    try {
      const name1 = (await usersData.getName(uid1)) || "User1";
      const name2 = (await usersData.getName(uid2)) || "User2";

      // ১. ব্যাকগ্রাউন্ড ইমেজ ডাউনলোড/লোড
      await fs.ensureDir(cachePath);
      if (!fs.existsSync(localBgPath)) {
        const bgRes = await axios.get(bgURL, { responseType: "arraybuffer" });
        await fs.writeFile(localBgPath, Buffer.from(bgRes.data));
      }

      // ২. প্রোফাইল পিকচার বাফার হিসেবে ডাউনলোড (Fix for image not showing)
      async function getAvatar(uid) {
        const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(res.data);
      }

      const [avatar1, avatar2, bgImgData] = await Promise.all([
        getAvatar(uid1),
        getAvatar(uid2),
        fs.readFile(localBgPath)
      ]);

      const [boyImg, girlImg, bgImg] = await Promise.all([
        loadImage(avatar1),
        loadImage(avatar2),
        loadImage(bgImgData)
      ]);

      // ৩. ক্যানভাস ডিজাইন
      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0);

      function drawCircle(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(boyImg, avatarConfig.boy.x, avatarConfig.boy.y, avatarConfig.boy.size);
      drawCircle(girlImg, avatarConfig.girl.x, avatarConfig.girl.y, avatarConfig.girl.size);

      // ৪. ইমেজ সেভ ও রিপ্লাই
      const imgPath = path.join(cachePath, `kiss_${uid1}_${uid2}.png`);
      await fs.writeFile(imgPath, canvas.toBuffer());

      api.unsendMessage(processing.messageID);

      await message.reply({
        body: `💋 ${name1} just kissed ${name2}! ❤️`,
        attachment: fs.createReadStream(imgPath)
      });

      // ৫. ক্যাশ ক্লিনআপ
      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 10000);

    } catch (err) {
      console.error(err);
      if(processing.messageID) api.unsendMessage(processing.messageID);
      return message.reply("❌ | Couldn't create the kiss image. Make sure the user's profile is public.");
    }
  }
};