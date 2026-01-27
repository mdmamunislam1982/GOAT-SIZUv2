const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "gift",
        version: "4.0.0",
        author: "SiFu",
        countDown: 10,
        role: 0,
        category: "economy",
        guide: {
            en: "{pn} [amount] (reply) | {pn} @tag [amount]"
        }
    },

    onStart: async function ({ args, usersData, message, event }) {
        const { senderID, mentions, type, messageReply } = event;

        // Smart Number Formatter (1M, 1B, 1T etc.)
        const formatSmart = (num) => {
            if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
            if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
            if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
            if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
            return num.toLocaleString();
        };

        const parseAmount = (input) => {
            if (!input) return NaN;
            let value = input.toLowerCase();
            let number = parseFloat(value);
            if (value.endsWith('k')) return number * 1000;
            if (value.endsWith('m')) return number * 1000000;
            if (value.endsWith('b')) return number * 1000000000;
            if (value.endsWith('t')) return number * 1000000000000;
            return number;
        };

        let targetID, rawAmount;
        if (type === "message_reply") {
            targetID = messageReply.senderID;
            rawAmount = args[0];
        } else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            rawAmount = args[args.length - 1];
        } else if (args.length >= 2) {
            targetID = args[0];
            rawAmount = args[1];
        } else {
            return message.reply("⚡ [ SYSTEM ] : Recipient & Amount required.");
        }

        const amount = Math.floor(parseAmount(rawAmount));
        if (isNaN(amount) || amount <= 0) return message.reply("🚫 [ ERROR ] : Invalid Credit Value.");
        if (targetID == senderID) return message.reply("⚠️ [ DENIED ] : Self-transfer blocked.");

        try {
            const senderBalance = await usersData.get(senderID, "money");
            if (amount > senderBalance) return message.reply(`📉 [ LOW FUNDS ] : $${formatSmart(senderBalance)} available.`);

            const receiverName = await usersData.getName(targetID);
            const senderName = await usersData.getName(senderID);
            const receiverBalance = await usersData.get(targetID, "money") || 0;

            const newSenderBal = senderBalance - amount;
            const newReceiverBal = receiverBalance + amount;

            await usersData.set(senderID, newSenderBal, "money");
            await usersData.set(targetID, newReceiverBal, "money");

            // --- Canvas Generation ---
            const canvas = createCanvas(1000, 550);
            const ctx = canvas.getContext("2d");

            // 1. Dark Cyber Background
            ctx.fillStyle = "#05050a";
            ctx.fillRect(0, 0, 1000, 550);

            // 2. Neon Hexagon Pattern
            ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
            for (let i = 0; i < 1100; i += 40) {
                for (let j = 0; j < 600; j += 40) {
                    ctx.beginPath();
                    ctx.moveTo(i, j);
                    ctx.lineTo(i + 20, j + 10);
                    ctx.stroke();
                }
            }

            // 3. The Card Shell (Glassmorphism)
            const cardGrad = ctx.createLinearGradient(0, 0, 1000, 550);
            cardGrad.addColorStop(0, "rgba(15, 15, 25, 0.95)");
            cardGrad.addColorStop(1, "rgba(5, 10, 20, 0.95)");
            ctx.fillStyle = cardGrad;
            ctx.roundRect(40, 40, 920, 470, 45);
            ctx.fill();

            // 4. Double Neon Border
            ctx.shadowBlur = 25;
            ctx.shadowColor = "#00f2ff";
            ctx.strokeStyle = "#00f2ff";
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.shadowBlur = 10;
            ctx.strokeStyle = "#ff00d4"; // Second Accent
            ctx.strokeRect(60, 60, 880, 430);
            ctx.shadowBlur = 0;

            // 5. Titles
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 45px 'Segoe UI', Arial";
            ctx.fillText("SIZU TRANSFER", 90, 110);
            
            ctx.font = "18px Courier New";
            ctx.fillStyle = "rgba(0, 242, 255, 0.7)";
            ctx.fillText(`TXID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 90, 140);

            // 6. Sender & Receiver Data
            ctx.font = "24px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fillText("DISPATCHER", 90, 200);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px Arial";
            ctx.fillText(senderName.toUpperCase(), 90, 240);

            ctx.font = "24px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fillText("RECIPIENT", 90, 300);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px Arial";
            ctx.fillText(receiverName.toUpperCase(), 90, 340);

            // 7. Amount Display (Big & Bold)
            const amtBoxWidth = ctx.measureText(`$${formatSmart(amount)}`).width + 60;
            ctx.fillStyle = "rgba(0, 255, 136, 0.15)";
            ctx.roundRect(85, 370, Math.max(amtBoxWidth, 300), 90, 20);
            ctx.fill();
            
            ctx.font = "bold 60px Arial";
            ctx.fillStyle = "#00ff88";
            ctx.fillText(`$${formatSmart(amount)}`, 110, 435);

            // 8. Avatars with Overlap Design
            const getAv = async (id) => {
                try {
                    const url = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                    return await loadImage(url);
                } catch {
                    return await loadImage("https://i.imgur.com/Ha6DMwk.jpeg");
                }
            };

            const senderAv = await getAv(senderID);
            const targetAv = await getAv(targetID);

            // Draw Avatars
            const drawCircleAv = (img, x, y, color) => {
                ctx.save();
                ctx.shadowBlur = 30;
                ctx.shadowColor = color;
                ctx.beginPath();
                ctx.arc(x, y, 90, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, x - 90, y - 90, 180, 180);
                ctx.restore();
            };

            drawCircleAv(senderAv, 780, 220, "#ff00d4");
            drawCircleAv(targetAv, 830, 330, "#00f2ff");

            // 9. Side Balances (Real-time Value)
            ctx.font = "22px 'Segoe UI'";
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.textAlign = "right";
            ctx.fillText(`YOUR BAL: $${formatSmart(newSenderBal)}`, 920, 80);
            ctx.fillText(`THEIR BAL: $${formatSmart(newReceiverBal)}`, 920, 110);

            const cachePath = path.join(__dirname, "cache", `gift_${Date.now()}.png`);
            if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
            
            fs.writeFileSync(cachePath, canvas.toBuffer());

            return message.reply({
                attachment: fs.createReadStream(cachePath)
            }, () => fs.unlinkSync(cachePath));

        } catch (error) {
            console.error(error);
            return message.reply("⚡ [ CRITICAL ERROR ] : Transaction Failed.");
        }
    }
};