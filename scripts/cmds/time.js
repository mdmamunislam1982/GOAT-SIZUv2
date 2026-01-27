const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function toFullWidthBold(str) {
  const map = {
    A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',
    H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',
    O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',
    V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙',
    a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',
    h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',
    o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',
    v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳',
    0:'𝟎',1:'𝟏',2:'𝟐',3:'𝟑',4:'𝟒',5:'𝟓',
    6:'𝟔',7:'𝟕',8:'𝟖',9:'𝟗'
  };
  return str.split('').map(c => map[c] || c).join('');
}

function formatTime12Hour(date) {
  let hour = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? "𝐏𝐌" : "𝐀𝐌";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${min} ${ampm}`;
}

function getDhakaDate() {
  const now = new Date();
  const offset = 6 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + offset * 60000);
}

function getUptime() {
  const seconds = process.uptime();
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

async function createTimeCard() {
  const width = 800, height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background: dark layered with soft glow
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#000814");
  bgGradient.addColorStop(1, "#001d3d");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const now = getDhakaDate();
  const timeText = toFullWidthBold(formatTime12Hour(now));
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const dateText = toFullWidthBold(dateStr);
  const uptime = getUptime();

  // Add soft neon grid/circuit overlay
  ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Time text
  ctx.font = "74px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#00ccff";
  ctx.shadowColor = "#00ccff";
  ctx.shadowBlur = 35;
  ctx.fillText(timeText, width / 2, 130);

  // Date text
  ctx.font = "28px Arial";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#999999";
  ctx.fillText(dateText, width / 2, 185);

  // Bangladesh
  ctx.font = "24px Arial";
  ctx.fillStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 15;
  ctx.fillText("𝐁𝐚𝐧𝐠𝐥𝐚𝐝𝐞𝐬𝐡", width / 2, 225);

  // (Asia/Dhaka)
  ctx.font = "18px Arial";
  ctx.shadowBlur = 5;
  ctx.fillText("(Asia/Dhaka)", width / 2, 255);

  // Divider
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#00ccff";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(60, 285);
  ctx.lineTo(width - 60, 285);
  ctx.stroke();

  // Uptime
  ctx.textAlign = "left";
  ctx.font = "18px Arial";
  ctx.fillStyle = "#00ccff";
  ctx.shadowColor = "#00ccff";
  ctx.shadowBlur = 6;
  ctx.fillText(`Uptime: ${uptime}`, 60, 315);

  ctx.textAlign = "right";
  ctx.font = "16px Arial";
  ctx.fillStyle = "#00ccff";
  ctx.shadowBlur = 0;
  ctx.fillText("𝐘𝐨𝐮𝐫 —͟͟͞͞𝐒𝐈𝐙𝐔~", width - 60, 315);

  return canvas.toBuffer("image/png");
}

module.exports = {
  config: {
    name: "time",
    version: "1.3",
    author: "SiFu",
    role: 0,
    countDown: 3,
    shortDescription: "Stylish futuristic time card",
    category: "time"
  },

  onStart: async ({ message }) => {
    const buffer = await createTimeCard();
    const filePath = path.join(__dirname, "cache", "time_card.png");
    fs.writeFileSync(filePath, buffer);
    return message.reply({ attachment: fs.createReadStream(filePath) });
  }
};