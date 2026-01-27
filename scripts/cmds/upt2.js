const os = require("os");
const startTime = new Date(); // সার্ভার শুরু হওয়ার সময়

module.exports = {
  config: {
    name: "uptime2",
    aliases: ["up2","upt2"],
    version: "1.0.6",
    author: "SHIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "বটের আপটাইম এবং সিস্টেম তথ্য দেখুন",
    longDescription: "বট কতক্ষণ ধরে চলছে এবং সিস্টেমের অবস্থা জানতে পারেন।",
    category: "up info"
  },

  onStart: async function ({ api, event }) {
    try {
      // লোডিং মেসেজ পাঠানো
      const sent = await api.sendMessage("| ʟᴏᴀᴅɪɴɢ ᴜᴘᴛɪᴍᴇ ᴀɴᴅ sʏsᴛᴇᴍ ᴅᴀᴛᴀ...", event.threadID);
      const messageID = sent.messageID;

      // অ্যানিমেশনের ধাপগুলো
      const animationSteps = [
        { text: "[██░░░░░░░░░] 17%\nᴘʀᴏᴄᴇssɪɴɢ ɪs sᴛᴀʀᴛɪɴɢ....", delay: 700 },
        { text: "[████░░░░░░░] 48%\nᴜᴘᴛɪᴍᴇ ɪs ʙᴇɪɴɢ ᴄᴀʟᴄᴜʟᴀᴛᴇᴅ...", delay: 700 },
        { text: "[███████░░░░] 66%\nᴛʜᴇ ᴍᴇᴍᴏʀʏ ᴅᴀᴛᴀ ɪs ʙᴇɪɴɢ ᴄᴏʟʟᴇᴄᴛᴇᴅ...", delay: 700 },
        { text: "[███████████] 99%\nᴇᴠᴇʀʏᴛʜɪɴɢ ɪs ʙᴇɪɴɢ ᴘᴀᴄᴋᴇᴅ...", delay: 800 }
      ];

      // ধাপে ধাপে অ্যানিমেশন দেখানো
      for (const step of animationSteps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        try {
          await api.editMessage(step.text, messageID);
        } catch (e) {
          console.error("অ্যানিমেশন আপডেট করা যায়নি:", e);
          break;
        }
      }

      // আপটাইম হিসাব
      const uptimeInSeconds = Math.floor((new Date() - startTime) / 1000);
      const days = Math.floor(uptimeInSeconds / (3600 * 24));
      const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
      const secondsLeft = uptimeInSeconds % 60;
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;

      // মেমোরি তথ্য
      const totalMemoryGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
      const freeMemoryGB = (os.freemem() / (1024 ** 3)).toFixed(2);
      const usedMemoryGB = (totalMemoryGB - freeMemoryGB).toFixed(2);

      // ফাইনাল মেসেজ
      const systemInfo = `
♡  ∩_∩                        ∩_∩  ♡
（„• ֊ •„)_𝑺𝑰𝒁𝑼𝑲𝑨_ („• ֊ •„)
╭─∪∪─────────∪∪─⟡
│ ───꯭──⃝‌‌𝑈𝑝𝑡 𝐼𝑛𝑓𝑜───
├───────────────⟡
│🍁 𝑅𝑢𝑛𝑡𝑖𝑚𝑒
│ ${uptimeFormatted}
│ 🍁 𝑀𝑒𝑚𝑜𝑟𝑦
│ 𝚃𝙾𝚃𝙰𝙻: ${totalMemoryGB} GB
│ 𝙵𝚁𝙴𝙴: ${freeMemoryGB} GB
│ 𝚄𝚂𝙴𝙳: ${usedMemoryGB} GB
├───────────────⟡
│     𓆩ℭ.𝔈.𝔒⸙𝔖ℌℑ𝔉𝔄𝔗𓆪
╰───────────────⟡
`;

      await new Promise(resolve => setTimeout(resolve, 1000));
      await api.editMessage(systemInfo, messageID);

    } catch (error) {
      console.error("সিস্টেম তথ্য আনতে সমস্যা:", error);
      api.sendMessage("❌ | সিস্টেম তথ্য আনা সম্ভব হচ্ছে না!", event.threadID);
    }
  }
};
