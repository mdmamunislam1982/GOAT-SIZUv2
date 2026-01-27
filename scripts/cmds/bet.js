const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

// সংখ্যা ফরম্যাট করার জন্য হেল্পার
function formatBalance(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, '') + "T$";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, '') + "B$";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, '') + "M$";
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, '') + "k$";
  return num + "$";
}

// ইনপুট অ্যামাউন্ট পার্স করার জন্য হেল্পার
function parseAmount(str, currentBalance) {
  str = str.toLowerCase().replace(/\s+/g, '');
  if (str === 'all') return currentBalance;
  const match = str.match(/^([\d.]+)([kmbt]?)$/);
  if (!match) return NaN;
  let num = parseFloat(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'k': num *= 1e3; break;
    case 'm': num *= 1e6; break;
    case 'b': num *= 1e9; break;
    case 't': num *= 1e12; break;
  }
  return Math.floor(num);
}

module.exports.config = {
  name: "bet",
  version: "2.1",
  author: "SiFu",
  countDown: 5,
  role: 0,
  shortDescription: "Casino-bet system 🗿",
  category: "game",
  guide: { en: "{p}bet <amount> — e.g. bet 1k or bet all" }
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;

  try {
    const userData = await usersData.get(senderID);
    let currentBalance = userData.money;

    if (!args[0])
      return api.sendMessage("Please enter amount: bet 500 / bet 1k / bet all", threadID, messageID);

    const betAmount = parseAmount(args[0], currentBalance);
    if (isNaN(betAmount) || betAmount <= 0)
      return api.sendMessage("🫩 Invalid bet amount!", threadID, messageID);

    if (betAmount > currentBalance)
      return api.sendMessage(`🗿 Not enough coins!\nYour Balance: ${formatBalance(currentBalance)}`, threadID, messageID);

    const multipliers = [2, 3, 5, 10];
    const chosenMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    
    // Win logic updated to 60%
    const win = Math.random() < 0.6; 

    let newBalance, resultText, profit = 0;

    if (win) {
      profit = betAmount * (chosenMultiplier - 1);
      newBalance = currentBalance + profit;
      resultText = `JACKPOT! ${chosenMultiplier}x`;
    } else {
      profit = betAmount;
      newBalance = currentBalance - betAmount;
      resultText = "TRY AGAIN";
    }

    await usersData.set(senderID, { money: newBalance });

    const avatarUrl = `https://graph.facebook.com/${senderID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    let avatar;
    try {
      const res = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      avatar = await loadImage(res.data);
    } catch (e) {
      avatar = null;
    }

    const filePath = await generateCasinoCard({
      userName: userData.name,
      avatar,
      betAmount,
      resultText,
      multiplier: win ? chosenMultiplier : null,
      profit: profit,
      newBalance,
      win
    });

    await api.sendMessage({
      body: win ? `🎀 You won 🎀 ${formatBalance(profit)}!🎀` : `😿 You lost 😿 ${formatBalance(betAmount)}!😿`,
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

    setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 10000);

  } catch (error) {
    console.error(error);
    api.sendMessage("An error occurred during the game.", threadID, messageID);
  }
};

async function generateCasinoCard(data) {
  const width = 900, height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = data.win ? '#00ff88' : '#ff4444';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.font = 'bold 60px Arial';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.fillText('🎀 SIZU CASINO 🎀', width / 2, 100);

  if (data.avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 200, 70, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(data.avatar, 50, 130, 140, 140);
    ctx.restore();
  }

  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(data.userName, 230, 190);
  ctx.fillStyle = '#00ffcc';
  ctx.fillText(`Bet: ${formatBalance(data.betAmount)}`, 230, 240);

  ctx.font = 'bold 70px Arial';
  ctx.fillStyle = data.win ? '#00ff00' : '#ff0000';
  ctx.textAlign = 'center';
  ctx.fillText(data.resultText, width / 2, 380);

  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = data.win ? '#00ff00' : '#ff4444';
  ctx.fillText(data.win ? `+${formatBalance(data.profit)}` : `-${formatBalance(data.betAmount)}`, width / 2, 480);

  ctx.font = '30px Arial';
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`New Balance: ${formatBalance(data.newBalance)}`, width / 2, 550);

  const cacheDir = path.join(__dirname, 'cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = path.join(cacheDir, `bet_${Date.now()}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer());
  return filePath;
}