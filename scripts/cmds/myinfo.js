const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "myinfo",
    aliases: [],
    version: "4.5",
    author: "SiFu",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Updated Profile UI" },
    category: "info"
  },

  onStart: async function ({ event, message, usersData, args, api, threadsData }) {
    const { threadID, senderID, mentions, messageReply, type } = event;

    let uid = type === "message_reply" ? messageReply.senderID : Object.keys(mentions)[0] || args[0] || senderID;
    if (!/^\d+$/.test(uid)) uid = senderID;

    const loading = await message.reply("🎀 please w8... ");

    try {
      const userData = await usersData.get(uid) || {};
      const allUsers = await usersData.getAll() || [];
      const threadData = await threadsData.get(threadID) || { members: [] };
      const memberData = threadData.members.find(m => m.userID === uid);
      
      let userInfo;
      try {
        userInfo = await api.getUserInfo(uid);
      } catch (err) { userInfo = {}; }

      const name = userInfo[uid]?.name || userData.name || "FB User";
      const money = userData.money || 0;
      const exp = userData.exp || 0;
      const messages = memberData ? memberData.count || 0 : 0;

      let genderText = "Secret";
      let genderCode = userInfo[uid]?.gender || userData.gender;
      if (genderCode === 2 || genderCode === "MALE") genderText = "Male";
      else if (genderCode === 1 || genderCode === "FEMALE") genderText = "Female";

      const expRank = allUsers.filter(u => u.exp).sort((a, b) => b.exp - a.exp).findIndex(u => u.userID === uid) + 1 || "N/A";
      const moneyRank = allUsers.filter(u => u.money).sort((a, b) => b.money - a.money).findIndex(u => u.userID === uid) + 1 || "N/A";
      
      const level = Math.floor(Math.sqrt(1 + (8 * exp) / 5) / 2) || 1;
      const nextExp = Math.floor(((Math.pow(level + 1, 2) - (level + 1)) * 5) / 2);
      const currentLevelExp = Math.floor(((Math.pow(level, 2) - level) * 5) / 2);
      let progress = ((exp - currentLevelExp) / (nextExp - currentLevelExp)) * 100;
      progress = Math.min(Math.max(progress, 0), 100);

      // ছবি লোড করার ফিক্সড লিংক
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const fallbackUrl = `https://graph.facebook.com/${uid}/picture?type=large`;
      const bgUrl = "https://i.imgur.com/JNDq6WG.jpeg"; 

      const downloadImage = async (url) => {
        try {
          const res = await axios.get(url, { responseType: "arraybuffer" });
          return await loadImage(Buffer.from(res.data));
        } catch (e) { return null; }
      };

      let bgImg = await downloadImage(bgUrl);
      let avatarImg = await downloadImage(avatarUrl) || await downloadImage(fallbackUrl);
      
      if (!avatarImg) {
         avatarImg = await downloadImage("https://i.imgur.com/6EE4oxp.png"); // Default avatar
      }

      const canvas = createCanvas(1366, 768);
      const ctx = canvas.getContext("2d");

      // ড্রয়িং
      if (bgImg) ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      else { ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ইনফো বক্স (Rect fallback)
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(420, 270, 850, 260);

      // প্রোফাইল পিকচার
      const avX = 120, avY = 200, avSize = 260;
      ctx.save();
      ctx.beginPath();
      ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#00d2ff";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(avatarImg, avX, avY, avSize, avSize);
      ctx.restore();

      // টেক্সট
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 70px sans-serif";
      ctx.fillText((name.substring(0, 15)).toUpperCase(), 430, 200);

      ctx.fillStyle = "#00d2ff";
      ctx.font = "bold 35px sans-serif";
      ctx.fillText(`LEVEL ${level}`, 435, 245);

      const drawData = (label, value, x, y) => {
        ctx.fillStyle = "#aaaaaa"; ctx.font = "30px sans-serif";
        ctx.fillText(label, x, y);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 32px sans-serif";
        ctx.fillText(value, x, y + 45);
      };

      drawData("USER ID", uid, 460, 330);
      drawData("MONEY", `$${money.toLocaleString()}`, 460, 440);
      drawData("GENDER", genderText, 750, 330);
      drawData("MESSAGES", messages.toLocaleString(), 750, 440);
      drawData("EXP RANK", `#${expRank}`, 1020, 330);
      drawData("MONEY RANK", `#${moneyRank}`, 1020, 440);

      // প্রগ্রেস বার
      ctx.fillStyle = "#333";
      ctx.fillRect(420, 580, 850, 45);
      ctx.fillStyle = "#00d2ff";
      ctx.fillRect(420, 580, (850 * progress) / 100, 45);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.floor(progress)}% progress to level ${level + 1}`, 420 + 850 / 2, 612);

      const imgPath = path.join(__dirname, "cache", `${uid}_profile.png`);
      fs.ensureDirSync(path.join(__dirname, "cache"));
      fs.writeFileSync(imgPath, canvas.toBuffer());
      
      api.unsendMessage(loading.messageID);
      return message.reply({
        body: `${name}`,
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error(err);
      return message.reply(`❌ এরর: ${err.message}`);
    }
  }
};