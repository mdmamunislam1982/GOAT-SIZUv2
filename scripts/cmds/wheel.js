const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "wheel",
    version: "4.0.0",
    author: "SiFu",
    countDown: 5,
    role: 0,
    shortDescription: "🎡 Dynamic Casino Wheel",
    category: "game",
    guide: {
      en: "{p}wheel <amount/all>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    // --- Money Formatter ---
    const formatMoney = (n) => {
      const units = [
        { value: 1e303, symbol: "Ct" }, { value: 1e100, symbol: "Googol" },
        { value: 1e33, symbol: "Dc" }, { value: 1e30, symbol: "No" },
        { value: 1e27, symbol: "Oc" }, { value: 1e24, symbol: "Sp" },
        { value: 1e21, symbol: "Sx" }, { value: 1e18, symbol: "Qa" },
        { value: 1e15, symbol: "Q" }, { value: 1e12, symbol: "T" },
        { value: 1e9, symbol: "B" }, { value: 1e6, symbol: "M" },
        { value: 1e3, symbol: "K" }
      ];
      for (let u of units) {
        if (n >= u.value) return (n / u.value).toFixed(2) + u.symbol;
      }
      return n.toLocaleString();
    };

    const parseBet = (input, currentMoney) => {
      if (!input) return null;
      const str = input.toLowerCase();
      if (str === 'all' || str === 'shob') return currentMoney;
      let multiplier = 1;
      if (str.endsWith('k')) multiplier = 1e3;
      else if (str.endsWith('m')) multiplier = 1e6;
      else if (str.endsWith('b')) multiplier = 1e9;
      const num = parseFloat(str.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : Math.floor(num * multiplier);
    };

    const user = await usersData.get(senderID);
    const currentMoney = user.money || 0;
    const bet = parseBet(args[0], currentMoney);

    if (!bet || bet <= 0) return api.sendMessage("😿 | Invalid bet amount!", threadID, messageID);
    if (currentMoney < bet) return api.sendMessage(`🐳 | Insufficient Balance!`, threadID, messageID);

    // --- Game Engine ---
    const segments = [
      { label: "JACKPOT", mul: 10, prob: 0.05, color: "#FFD700" },
      { label: "MEGA WIN", mul: 5, prob: 0.10, color: "#FF4500" },
      { label: "BIG WIN", mul: 3, prob: 0.15, color: "#9400D3" },
      { label: "WIN", mul: 2, prob: 0.25, color: "#00FF00" },
      { label: "SMALL WIN", mul: 1.2, prob: 0.20, color: "#1E90FF" },
      { label: "LOSE", mul: 0, prob: 0.25, color: "#808080" }
    ];

    let random = Math.random();
    let result = segments[segments.length - 1];
    let cumulative = 0;
    for (const seg of segments) {
      cumulative += seg.prob;
      if (random < cumulative) { result = seg; break; }
    }

    const winnings = Math.floor(bet * result.mul);
    const newBalance = (currentMoney - bet) + winnings;
    await usersData.set(senderID, { money: newBalance });

    // --- Dynamic Result Images (Self-Generating) ---
    // জিতলে গোল্ডেন ইফেক্ট আর হারলে ডার্ক রেড ইফেক্ট আসবে
    const canvas = createCanvas(500, 850);
    const ctx = canvas.getContext("2d");

    const drawCard = async (isFinal) => {
      // Background
      ctx.fillStyle = result.mul > 0 ? "#1a1a2e" : "#1a0f0f";
      ctx.fillRect(0, 0, 500, 850);
      
      // Border
      ctx.strokeStyle = result.color;
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 480, 830);

      // Status Title
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = result.color;
      ctx.textAlign = "center";
      ctx.fillText(result.mul > 0 ? "🌟 CASINO WIN 🌟" : "💀 CASINO LOSE 💀", 250, 80);

      // User Avatar
      try {
        const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatar = await loadImage(Buffer.from(avatarRes.data));
        ctx.save();
        ctx.beginPath(); ctx.arc(250, 220, 80, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(avatar, 170, 140, 160, 160);
        ctx.restore();
      } catch (e) {}

      // Text Data
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff"; ctx.font = "25px Arial";
      ctx.fillText("💰 BET AMOUNT:", 60, 360);
      ctx.fillStyle = "#00FF00"; ctx.fillText(`${formatMoney(bet)} $`, 60, 400);

      ctx.fillStyle = "#ffffff"; ctx.fillText("🎀 RESULT:", 60, 460);
      ctx.fillStyle = result.color; ctx.font = "bold 35px Arial";
      ctx.fillText(`${result.label} (x${result.mul})`, 60, 500);

      ctx.fillStyle = "#ffffff"; ctx.font = "25px Arial";
      ctx.fillText("🗿 NEW BALANCE:", 60, 560);
      ctx.fillStyle = "#00BFFF"; ctx.fillText(`${formatMoney(newBalance)} $`, 60, 600);

      // Result Indicator (The Wheel Part)
      ctx.save();
      ctx.translate(250, 720);
      // হারলে চাকা উল্টো ঘুরবে বা কাঁপবে এমন স্টাইল
      if (!isFinal) ctx.rotate(Math.random() * Math.PI * 2); 
      
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.fillStyle = result.color;
      ctx.fill();
      ctx.fillStyle = "#000"; ctx.textAlign = "center"; ctx.font = "bold 20px Arial";
      ctx.fillText(result.label, 0, 10);
      ctx.restore();
    };

    // --- Process Flow ---
    // ১. প্রথমে স্পিনিং মেসেজ
    const spinMsg = await api.sendMessage("🎡 | Calculating your destiny...", threadID);

    // ২. রেজাল্ট কার্ড জেনারেট করা
    await drawCard(true);
    const imagePath = path.join(__dirname, "cache", `wheel_v4_${senderID}.png`);
    fs.ensureDirSync(path.join(__dirname, "cache"));
    fs.writeFileSync(imagePath, canvas.toBuffer("image/png"));

    if (spinMsg) api.unsendMessage(spinMsg.messageID);

    return api.sendMessage({
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => fs.unlinkSync(imagePath));
  }
};