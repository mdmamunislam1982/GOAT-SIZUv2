const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

function formatMoney(n) {
    if (n < 1e3) return n.toFixed(0);
    const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
    const unit = Math.floor((Math.log10(n)) / 3);
    return (n / Math.pow(10, unit * 3)).toFixed(1) + units[unit < units.length ? unit : units.length - 1];
}

async function getAvatar(userID) {
    try {
        const url = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        return loadImage(res.data);
    } catch (e) {
        return loadImage("https://i.imgur.com/666VInY.png"); // Default Avatar
    }
}

module.exports = {
    config: {
        name: "top",
        aliases: ["lb"],
        version: "5.0",
        author: "SiFu-- & AI",
        role: 0,
        category: "economy",
        guide: { en: "{pn} | reply to image with page number" }
    },

    onReply: async function ({ api, message, event, usersData, Reply }) {
        if (Reply.type !== "top_page") return;
        const page = parseInt(event.body);
        if (isNaN(page)) return;
        
        // পুনরায় জেনারেট করার জন্য মূল ফাংশন কল করা
        this.onStart({ api, message, usersData, args: [page], event });
    },

    onStart: async function ({ api, message, usersData, args, event }) {
        try {
            const page = parseInt(args[0]) || 1;
            const itemsPerPage = 10;
            const BG_URL = "https://i.imgur.com/ZSAXErf.jpeg";

            const allUsers = await usersData.getAll();
            const sortedData = allUsers
                .map(u => ({ userId: u.userID, name: u.name || "Facebook User", total: u.money || 0 }))
                .sort((a, b) => b.total - a.total);

            const pageUsers = sortedData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
            if (pageUsers.length === 0) return message.reply("এই পেজে কোনো ডাটা নেই।");

            const canvas = createCanvas(800, 1000);
            const ctx = canvas.getContext('2d');

            // Custom Background
            const background = await loadImage(BG_URL);
            ctx.drawImage(background, 0, 0, 800, 1000);
            
            // Dark Overlay for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, 800, 1000);

            // Header
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.fillText(`TOP ${sortedData.length > 10 ? 'PLAYERS' : '10'}`, 400, 80);

            let currentY = 160;
            const rowHeight = 70;
            const margin = 50;

            for (let i = 0; i < pageUsers.length; i++) {
                const u = pageUsers[i];
                const rank = ((page - 1) * itemsPerPage) + i + 1;
                const avatar = await getAvatar(u.userId);

                // Row Design
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(margin, currentY - 45, 700, rowHeight);

                // Rank & Avatar
                ctx.textAlign = 'left';
                ctx.fillStyle = rank <= 3 ? '#FFD700' : '#FFF';
                ctx.font = 'bold 30px Arial';
                ctx.fillText(`#${rank}`, margin + 20, currentY);

                ctx.save();
                ctx.beginPath();
                ctx.arc(margin + 100, currentY - 10, 25, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(avatar, margin + 75, currentY - 35, 50, 50);
                ctx.restore();

                // Name & Balance
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 26px Arial';
                ctx.fillText(u.name.substring(0, 18), margin + 150, currentY);

                ctx.textAlign = 'right';
                ctx.fillStyle = '#00FF00';
                ctx.fillText(`${formatMoney(u.total)} $`, 730, currentY);

                currentY += rowHeight + 10;
            }

            // Footer info
            ctx.textAlign = 'center';
            ctx.fillStyle = '#CCC';
            ctx.font = 'italic 20px Arial';
            ctx.fillText(`Page ${page} | Reply with page number (2, 3...) to see more`, 400, 960);

            const outputPath = path.join(__dirname, 'cache', `top_${event.senderID}.png`);
            fs.ensureDirSync(path.dirname(outputPath));
            fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));

            message.reply({
                attachment: fs.createReadStream(outputPath)
            }, (err, info) => {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "top_page"
                });
                fs.unlinkSync(outputPath);
            });

        } catch (err) {
            console.error(err);
            message.reply("লিডারবোর্ড তৈরি করতে সমস্যা হয়েছে।");
        }
    }
};
