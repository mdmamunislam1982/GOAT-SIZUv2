const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

// Helper to format money
function formatMoney(n) {
  const units = ["", "K", "M", "B", "T"];
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(1).replace(/\.0$/, "") + units[i];
}

// Function to draw a hexagon path
function drawHex(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Function to draw tech background pattern
function drawTechBackground(ctx, w, h) {
  // Dark Background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#050505");
  grad.addColorStop(1, "#101015");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Grid Lines
  ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  const gridSize = 40;

  for (let x = 0; x <= w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Random Tech Particles
  for(let i=0; i<30; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = Math.random() * 2;
    ctx.fillStyle = Math.random() > 0.5 ? "#00ffcc" : "#ff00ff";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, s, s);
    ctx.globalAlpha = 1.0;
  }
}

async function createSpyCard(opts) {
  const {
    uid,
    name, username, gender,
    type, birthday, nickname, location,
    money, rank, moneyRank
  } = opts;

  const W = 500, H = 880;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // 1. Draw Background
  drawTechBackground(ctx, W, H);

  // 2. Top & Bottom Neon Bars
  const drawNeonBar = (y, color1, color2) => {
    const grad = ctx.createLinearGradient(0, y, W, y);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.shadowColor = color2;
    ctx.shadowBlur = 15;
    ctx.fillRect(0, y, W, 6);
    ctx.shadowBlur = 0; // Reset shadow
  };

  drawNeonBar(0, "#ff00cc", "#3333ff");
  drawNeonBar(H - 6, "#00ffcc", "#00ff00");

  // 3. Avatar Section (Hexagon)
  let av;
  try {
    // Fetch avatar buffer directly using axios
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    av = await loadImage(response.data);
  } catch (err) {
    // Fallback image
    av = await loadImage("https://i.imgur.com/5JDlwx6.jpeg"); 
  }

  const cx = W / 2, cy = 160, r = 90;

  // Outer Glow Hexagon
  ctx.save();
  ctx.shadowColor = "#00ffcc";
  ctx.shadowBlur = 25;
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 5;
  drawHex(ctx, cx, cy, r + 5);
  ctx.stroke();
  ctx.restore();

  // Clip and Draw Avatar
  ctx.save();
  drawHex(ctx, cx, cy, r);
  ctx.clip();
  ctx.drawImage(av, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // 4. Header Text (Name)
  ctx.textAlign = "center";
  ctx.font = "bold 34px sans-serif"; 
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ff00ff";
  ctx.shadowBlur = 10;
  ctx.fillText(name, W / 2, cy + r + 50);

  ctx.shadowBlur = 0; // Reset
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#aaaaaa";
  ctx.fillText("ACCESS GRANTED - AGENT PROFILE", W / 2, cy + r + 80);

  // 5. Data Table
  const startY = cy + r + 110;
  const items = [
    { icon: "🆔", label: "UID", val: uid, color: "#ff0055" },
    { icon: "🌐", label: "User", val: username, color: "#00aaff" },
    { icon: "🚻", label: "Gender", val: gender, color: "#ffaa00" },
    { icon: "🎓", label: "Type", val: type || "User", color: "#00ffaa" },
    { icon: "🎂", label: "Birth", val: birthday || "Locked", color: "#aa00ff" },
    { icon: "🏷️", label: "Nick", val: nickname || name, color: "#ffffff" },
    { icon: "📍", label: "Loc", val: location || "Unknown", color: "#ff5555" },
    { icon: "💳", label: "Cash", val: `$${formatMoney(money)}`, color: "#ffff00" },
    { icon: "🏆", label: "XP Rank", val: `#${rank}`, color: "#00ff00" },
    { icon: "🏦", label: "Rich Rank", val: `#${moneyRank}`, color: "#00ffff" }
  ];

  let y = startY;
  const boxHeight = 42;
  const marginX = 25;

  ctx.textAlign = "left";

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Glassmorphism Background for Row
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(marginX, y, W - (marginX * 2), boxHeight);

    // Left Accent Bar
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(marginX, y, 4, boxHeight);
    ctx.shadowBlur = 0;

    // Label
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(`${item.icon}  ${item.label}`, marginX + 15, y + 27);

    // Value (Right Aligned relatively)
    ctx.font = "bold 19px monospace";
    ctx.fillStyle = item.color;

    const valueText = String(item.val);
    const textWidth = ctx.measureText(valueText).width;

    // Draw value aligned to the right side of the box
    ctx.fillText(valueText, (W - marginX - 15) - textWidth, y + 27);

    y += boxHeight + 10;
  }

  return canvas.toBuffer("image/png");
}

module.exports = {
  config: {
    name: "spy",
    version: "7.2",
    role: 0,
    author: "Ew'r Sifu", // Fixed Gender Logic by Gemini
    category: "information",
    description: "Generates an advanced neon spy card",
    countDown: 5
  },

  onStart: async ({ api, event, message, usersData }) => {
    try {
      const uid = Object.keys(event.mentions || {})[0] || event.messageReply?.senderID || event.senderID;

      const wait = await message.reply("🔄 Initializing Spy Protocol...");

      const [uInfo, uDB, allUsers] = await Promise.all([
        api.getUserInfo(uid),
        usersData.get(uid),
        usersData.getAll()
      ]);

      const info = uInfo[uid];

      // --- FIXED GENDER LOGIC ---
      let genderText = "Unknown";

      // Check API data first (Handles 2/1 numbers OR "MALE"/"FEMALE" strings)
      if (info.gender == 2 || info.gender === "MALE" || info.gender === "Male") {
        genderText = "Male";
      } else if (info.gender == 1 || info.gender === "FEMALE" || info.gender === "Female") {
        genderText = "Female";
      } else {
        // If API fails, check Database fallback
        if (uDB && uDB.gender) {
             if (uDB.gender == 2 || uDB.gender == "Male") genderText = "Male";
             else if (uDB.gender == 1 || uDB.gender == "Female") genderText = "Female";
        }
      }
      // ---------------------------

      const nickname = info.alternateName || info.name;
      const location = info.location?.name || "Hidden";

      // Calculate Ranks
      allUsers.sort((a, b) => b.exp - a.exp);
      const rank = allUsers.findIndex(u => u.userID === uid) + 1;

      allUsers.sort((a, b) => b.money - a.money);
      const moneyRank = allUsers.findIndex(u => u.userID === uid) + 1;

      const username = info.vanity || `id:${uid}`;

      const buffer = await createSpyCard({
        uid,
        name: info.name,
        username,
        gender: genderText, // Using the fixed variable
        type: info.type || "Agent",
        birthday: info.isBirthday ? "Today" : (info.birthday || "Confidential"),
        nickname,
        location,
        money: uDB.money || 0,
        rank,
        moneyRank
      });

      const dir = path.join(__dirname, "cache");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      const file = path.join(dir, `spy_v2_${uid}.png`);
      fs.writeFileSync(file, buffer);

      await message.unsend(wait.messageID);
      return message.reply({ 
        attachment: fs.createReadStream(file) 
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ System Error: Cannot generate card.");
    }
  }
};