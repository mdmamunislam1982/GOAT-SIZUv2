const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "notice",
        aliases: ["n"],
        version: "4.0",
        author: "SiFu",
        countDown: 5,
        role: 2, // শুধুমাত্র অ্যাডমিন
        shortDescription: "সব গ্রুপে মাল্টিমিডিয়া নোটিশ পাঠান",
        longDescription: "অ্যাডমিন এই কমান্ডের মাধ্যমে সব গ্রুপে একসাথে টেক্সট, অডিও, ভিডিও বা ছবি পাঠাতে পারবেন।",
        category: "owner",
        guide: "{pn} <বার্তা> (অথবা কোনো ছবি/ভিডিওতে রিপ্লাই দিয়ে)",
        envConfig: {
            delayPerGroup: 2000 // সেফটির জন্য ২ সেকেন্ড গ্যাপ (আইডি সেফ থাকবে)
        }
    },

    onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData }) {
        const { delayPerGroup } = envCommands[commandName];
        
        // ১. মেসেজ বডি এবং এটাচমেন্ট ডিটেকশন
        const msgBody = args.join(" ");
        const replyAttachments = event.messageReply ? event.messageReply.attachments : [];
        const currentAttachments = event.attachments.length > 0 ? event.attachments : [];
        const allAttachments = [...currentAttachments, ...replyAttachments];

        if (!msgBody && allAttachments.length === 0) {
            return message.reply("⚠️ দয়া করে কিছু লিখুন অথবা কোনো ছবি/ভিডিও/অডিও সংযুক্ত করুন।");
        }

        // ২. স্টাইলিশ টেক্সট ফরম্যাট
        const timestamp = new Date().toLocaleString("en-US", { 
            timeZone: "Asia/Dhaka",
            hour: '2-digit', minute: '2-digit', hour12: true,
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const stylishText = `ᯓᡣ𐭩 ᴀᴅᴍɪɴ ɴᴏᴛɪғɪᴄᴀᴛɪᴏɴ ᝰ.ᐟ\n────୨ৎ────────୨ৎ────\n\n` +
                            `✎ᝰ.\n ${msgBody || "Media Attachment Only"}\n\n` +
                            `────୨ৎ────────୨ৎ────\n` +
                             `ദ്ദി◝ ⩊ ◜.ᐟᴀᴅᴍɪɴ :  —͟͟͞͞ sɪғᴜ ᯓᡣ𐭩`;

        // ৩. মিডিয়া ডাউনলোড লজিক (Audio, Video, Photo)
        const cachePaths = [];
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        if (allAttachments.length > 0) {
            message.reply("⏳ মিডিয়া ডাউনলোড করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...");
            
            for (let i = 0; i < allAttachments.length; i++) {
                const item = allAttachments[i];
                // টাইপ চেক করে এক্সটেনশন সেট করা
                let ext = "jpg";
                if (item.type === "video") ext = "mp4";
                if (item.type === "audio") ext = "mp3";
                if (item.type === "animated_image") ext = "gif";

                const filePath = path.join(cacheDir, `notice_${Date.now()}_${i}.${ext}`);
                const url = item.url || item.uri; // uri এবং url দুইটাই চেক করবে

                try {
                    const response = await axios.get(url, { responseType: 'arraybuffer' });
                    fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));
                    cachePaths.push(filePath);
                } catch (e) {
                    console.error("Download Failed:", e);
                }
            }
        }

        // ৪. গ্রুপ লিস্ট সংগ্রহ (threadsData ব্যবহার করা ভালো)
        try {
            let groupThreads = [];
            
            // ডাটাবেস থেকে সব থ্রেড নেওয়া (বেশি নির্ভরযোগ্য)
            const allThreadsData = await threadsData.getAll();
            groupThreads = allThreadsData.filter(t => t.isGroup && t.threadID !== event.threadID);

            // যদি ডাটাবেস খালি থাকে, তবে API থেকে নেওয়ার চেষ্টা করবে (ব্যাকআপ)
            if (groupThreads.length === 0) {
                const inboxThreads = await api.getThreadList(100, null, ["INBOX"]);
                groupThreads = inboxThreads.filter(t => t.isGroup && t.threadID !== event.threadID);
            }

            if (groupThreads.length === 0) {
                return message.reply("❌ কোনো গ্রুপ খুঁজে পাওয়া যায়নি।");
            }

            message.reply(`🚀 ব্রডকাস্টিং শুরু...\n🎯 টার্গেট গ্রুপ: ${groupThreads.length} টি\n📎 মিডিয়া: ${cachePaths.length} টি`);

            let successCount = 0;
            let failedCount = 0;

            // ৫. ব্রডকাস্টিং লুপ
            for (const thread of groupThreads) {
                try {
                    const msgOptions = {
                        body: stylishText,
                        attachment: cachePaths.length > 0 ? cachePaths.map(p => fs.createReadStream(p)) : []
                    };

                    await api.sendMessage(msgOptions, thread.threadID);
                    successCount++;
                } catch (err) {
                    failedCount++;
                    // console.log(`Failed for ${thread.threadID}: ${err.message}`);
                }
                // স্প্যাম ব্লক এড়াতে ডিলে
                await new Promise(resolve => setTimeout(resolve, delayPerGroup));
            }

            // ৬. ফাইল ক্লিনআপ এবং রিপোর্ট
            cachePaths.forEach(p => {
                try { fs.unlinkSync(p); } catch (e) {}
            });

            const report = `✅ 𝐍𝐨𝐭𝐢𝐜𝐞 𝐒𝐞𝐧𝐭 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲!\n━━━━━━━━━━━━━━━━━━━━\n🔰 সফল: ${successCount}\n🚫 ব্যর্থ: ${failedCount}\n📊 মোট গ্রুপ: ${groupThreads.length}`;
            return message.reply(report);

        } catch (error) {
            return message.reply(`❌ সিস্টেম এরর: ${error.message}`);
        }
    }
};
