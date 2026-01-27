const os = require('os');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const si = require('systeminformation');

function sanitizePercentage(value, defaultVal = 0) {
    const num = parseFloat(value);
    if (isNaN(num)) return defaultVal;
    return Math.max(0, Math.min(100, num));
}

function formatUptime(seconds, short = false) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (short) return `${d}d`;
    return `${d}d ${h}h ${m}m ${s}s`;
}

function getCurrentCPUUsage() {
    return new Promise((resolve) => {
        const startCores = os.cpus();
        setTimeout(() => {
            const endCores = os.cpus();
            let totalIdle = 0;
            let totalTick = 0;

            for (let i = 0; i < endCores.length; i++) {
                const start = startCores[i].times;
                const end = endCores[i].times;
                totalTick += (end.user - start.user) + (end.nice - start.nice) + (end.sys - start.sys) + (end.irq - start.irq) + (end.idle - start.idle);
                totalIdle += (end.idle - start.idle);
            }
            const usage = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;
            resolve(Math.max(0, Math.min(100, usage)).toFixed(2));
        }, 100);
    });
}

async function getPrimaryDiskUsage() {
    try {
        const data = await si.fsSize();
        const primaryDisk = data.find(d => d.mount === '/' || d.fs.toLowerCase().startsWith('c:')) || data[0];
        if (primaryDisk) {
            return {
                use: primaryDisk.use,
                total: (primaryDisk.size / 1024 / 1024 / 1024).toFixed(1),
                used: (primaryDisk.used / 1024 / 1024 / 1024).toFixed(1)
            };
        }
    } catch (e) {
        console.error("Failed to get disk usage with systeminformation:", e);
    }
    return { use: 0, total: '0', used: '0' };
}

function drawRoundRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle = null, lineWidth = 1) {
    if (width <= 0 || height <= 0) return;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

function drawLinearProgressBar(ctx, x, y, width, height, progressPercentage, barColor, bgColor, label, valueText, font, textColor) {
    if (width <= 0 || height <= 0) return;
    const sanitizedProgress = sanitizePercentage(progressPercentage);

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);

    const progressWidth = (width * sanitizedProgress) / 100;
    if (progressWidth > 0) {
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, progressWidth, height);
    }

    ctx.fillStyle = textColor;
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - height - 2);

    ctx.textAlign = 'right';
    ctx.fillText(valueText, x + width, y - height - 2);
    ctx.textAlign = 'left';
}

function drawStatCircle(ctx, x, y, radius, mainText, subText, mainColor, subColor, circleColor, bgColor) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = circleColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = mainColor;
    ctx.font = `bold ${radius * 0.35}px Arial, Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainText, x, y - radius * 0.2);

    ctx.fillStyle = subColor;
    ctx.font = `${radius * 0.22}px Arial, Sans-Serif`;
    ctx.fillText(subText, x, y + radius * 0.4);
}

module.exports = {
    config: {
        name: 'uptime',
        aliases: ['upt'],
        version: '4.3',
        author: 'sifu',
        countDown: 15,
        role: 0,
        shortDescription: 'Display system stats as an image.',
        category: 'system',
    },

    onStart: async function ({ message }) {
        try {
            const botUptimeSeconds = process.uptime();
            const systemUptimeSeconds = os.uptime();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;

            let osMemoryUsagePercentageNum = (usedMemory / totalMemory) * 100;
            let currentCpuUsageNum = parseFloat(await getCurrentCPUUsage());
            const diskInfo = await getPrimaryDiskUsage();

            osMemoryUsagePercentageNum = sanitizePercentage(osMemoryUsagePercentageNum);
            currentCpuUsageNum = sanitizePercentage(currentCpuUsageNum);
            diskInfo.use = sanitizePercentage(diskInfo.use);

            const canvasWidth = 1000;
            const canvasHeight = 667;
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // *** MULTI RANDOM BACKGROUND HERE ***
            const bgList = [

     'https://i.ibb.co/vR8qj66/h3s-ZEZRyx-B.jpg.jpeg',

     'https://i.ibb.co/rGmRRGGm/Y7j-Y9-Vcf-PG.jpg.jpeg',

     'https://i.ibb.co/fdkdLrtk/v-VKZqzj-D6k.jpg.jpeg',

     'https://i.ibb.co/DHVs0sQ7/maa6-Gx-CDer.jpg.jpeg'

            ];

            const bgUrl = bgList[Math.floor(Math.random() * bgList.length)];

            try {
                const bgImage = await loadImage(bgUrl);
                ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
            } catch (imgError) {
                console.error("BG load failed:", imgError);
                ctx.fillStyle = '#030C29';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }

            // HEADER TEXT
            ctx.fillStyle = "#fff";
            ctx.font = `bold 32px Arial`;
            ctx.fillText("🌊 ʸᵒᵘʳ Sɪxᴜ 🎀", 30, 45);

            const now = new Date();
            ctx.font = `14px Arial`;
            ctx.textAlign = 'right';
            ctx.fillText(`${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`, canvasWidth - 30, 35);

            // Draw panels etc (ALL YOUR ORIGINAL CODE)
            // ------------------------------------------------------------
            const panelFillColor = '#000000B0';
            const panelStrokeColor = '#60A5FA88';
            const textColorPrimary = '#E5E7EB';
            const textColorSecondary = '#9CA3AF';
            const accentRed = '#F7546C';
            const accentPurple = '#A78BFA';
            const accentBlue = '#3B82F6';
            const progressBarBG = '#3A3D5288';
            const circleBG = '#00000099';

            const panelGap = 20;
            const panelY = 80;
            const panelHeight = canvasHeight - 110;
            const totalPanelWidth = canvasWidth - panelGap * 3;
            const panelWidth = totalPanelWidth / 2;
            const leftPanelX = panelGap;
            const rightPanelX = leftPanelX + panelWidth + panelGap;

            drawRoundRect(ctx, leftPanelX, panelY, panelWidth, panelHeight, 15, panelFillColor, panelStrokeColor, 2);
            drawRoundRect(ctx, rightPanelX, panelY, panelWidth, panelHeight, 15, panelFillColor, panelStrokeColor, 2);

            let currentY = panelY + 40;
            const leftMargin = leftPanelX + 30;
            const leftBarWidth = panelWidth - 60;
            const barHeight = 5;

            ctx.fillStyle = textColorPrimary;
            ctx.font = `bold 20px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText("System Status Overview", leftPanelX + panelWidth / 2, currentY);
            ctx.textAlign = 'left';

            currentY += 60;
            drawLinearProgressBar(ctx, leftMargin, currentY, leftBarWidth, barHeight, currentCpuUsageNum, accentRed, progressBarBG, "CPU Usage", `${currentCpuUsageNum.toFixed(1)}%`, `14px Arial`, textColorPrimary);

            currentY += 60;
            drawLinearProgressBar(ctx, leftMargin, currentY, leftBarWidth, barHeight, osMemoryUsagePercentageNum, accentPurple, progressBarBG, "Memory Usage", `${osMemoryUsagePercentageNum.toFixed(1)}%`, `14px Arial`, textColorPrimary);

            currentY += 60;
            drawLinearProgressBar(ctx, leftMargin, currentY, leftBarWidth, barHeight, diskInfo.use, accentBlue, progressBarBG, "Disk Usage", `${diskInfo.use}%`, `14px Arial`, textColorPrimary);

            currentY += 80;

            const infoItems = [
                { label: "Bot Uptime:", value: formatUptime(botUptimeSeconds) },
                { label: "System Uptime:", value: formatUptime(systemUptimeSeconds) },
                { label: "CPU Cores:", value: os.cpus().length },
                { label: "Total RAM:", value: `${(totalMemory / 1024 ** 3).toFixed(1)} GB` },
                { label: "Used Disk:", value: `${diskInfo.used} GB` }
            ];

            infoItems.forEach(item => {
                ctx.fillStyle = textColorSecondary;
                ctx.textAlign = 'left';
                ctx.fillText(item.label, leftMargin + 10, currentY);
                ctx.fillStyle = textColorPrimary;
                ctx.textAlign = 'right';
                ctx.fillText(item.value, leftPanelX + panelWidth - 30, currentY);
                currentY += 30;
            });

            // Right panel circles
            const buttonRadius = 35;
            const gridCols = 3;
            const gridRows = 4;
            const buttonStartX = rightPanelX + 20;
            const buttonStartY = panelY + 80;
            const colWidth = (panelWidth - 40) / gridCols;
            const rowHeight = (panelHeight - 100) / gridRows;

            const statsData = [
                { label: "CPU", value: `${currentCpuUsageNum.toFixed(1)}%`, color: accentRed },
                { label: "RAM", value: `${osMemoryUsagePercentageNum.toFixed(1)}%`, color: accentPurple },
                { label: "DISK", value: `${diskInfo.use}%`, color: accentBlue },
                { label: "BOT UP", value: formatUptime(botUptimeSeconds, true), color: textColorSecondary },
                { label: "SYS UP", value: formatUptime(systemUptimeSeconds, true), color: textColorSecondary },
                { label: "CORES", value: os.cpus().length, color: textColorSecondary },
                { label: "TOTAL RAM", value: `${(totalMemory / 1024 ** 3).toFixed(1)}GB`, color: accentPurple },
                { label: "USED RAM", value: `${(usedMemory / 1024 ** 3).toFixed(1)}GB`, color: accentPurple },
                { label: "TOTAL DISK", value: `${diskInfo.total}GB`, color: accentBlue },
                { label: "USED DISK", value: `${diskInfo.used}GB`, color: accentBlue }
            ];

            let index = 0;
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    if (index >= statsData.length) break;
                    const centerX = buttonStartX + col * colWidth + colWidth / 2;
                    const centerY = buttonStartY + row * rowHeight + rowHeight / 2;
                    const d = statsData[index];
                    drawStatCircle(ctx, centerX, centerY, buttonRadius, d.value, d.label, d.color, textColorSecondary, d.color, circleBG);
                    index++;
                }
            }

            const imgPath = path.join(__dirname, "cache", `system_image_${Date.now()}.png`);
            await fs.ensureDir(path.dirname(imgPath));
            fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

            return message.reply({ attachment: fs.createReadStream(imgPath) }, () => {
                fs.unlink(imgPath, () => {});
            });

        } catch (err) {
            console.error(err);
            return message.reply("❌ Error generating system dashboard.");
        }
    }
};
