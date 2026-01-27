const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "anya",
    author: "SiFu",
    version: "2.5",
    cooldowns: 5,
    role: 0,
    shortDescription: { en: "Anya Forger TTS" },
    longDescription: { en: "Convert text to speech using Anya Forger's voice (Spy x Family)" },
    category: "ai",
    guide: { en: "{p}anya [text]" }
  },

  onStart: async function ({ api, event, args }) {
    const { messageID, threadID, senderID } = event; // Variables scope এর বাইরে রাখা হয়েছে

    try {
      // টেকস্ট না থাকলে গাইড দেখাবে
      if (!args[0]) {
        return api.sendMessage(
          `╔═════✦❘༻༺❘✦═════╗\n\n` +
          `     🎀  𝗔𝗡𝗬𝗔 𝗙𝗢𝗥𝗚𝗘𝗥 𝗧𝗧𝗦\n` +
          `     💡 Usage: {p}anya [text]\n\n` +
          `╚═════✦❘༻༺❘✦═════╝`,
          threadID, messageID
        );
      }

      const text = args.join(" ");
      
      // Processing Reaction
      api.setMessageReaction("⏳", messageID, () => {}, true);

      // API Call - VoiceVox Speaker 3 (Anya style)
      const apiUrl = `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(text)}&speaker=3`;
      const response = await axios.get(apiUrl);

      if (!response.data.success) {
        throw new Error("API failed to generate sound.");
      }

      const audioUrl = response.data.mp3StreamingUrl;
      const cachePath = path.resolve(__dirname, 'cache');
      
      // ক্যাশ ফোল্ডার না থাকলে তৈরি করবে
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

      const filePath = path.join(cachePath, `anya_${senderID}_${Date.now()}.mp3`);

      // ফাইল ডাউনলোড
      const getAudio = await axios.get(audioUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(getAudio.data, "utf-8"));

      // সাকসেস মেসেজ এবং অডিও পাঠানো
      const successMsg = `╔═════✦❘༻༺❘✦═════╗\n\n` +
                         `   🎀 𝗔𝗡𝗬𝗔'𝗦 𝗠𝗘𝗦𝗦𝗔𝗚𝗘 \n\n` +
                         ` 🎙️: "${text}"\n` +
                         `╚═════✦❘༻༺❘✦═════╝`;

      return api.sendMessage({
        body: successMsg,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, messageID);

    } catch (error) {
      console.error("Anya TTS Error:", error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      
      return api.sendMessage(
        `╔═════✦❘༻༺❘✦═════╗\n\n` +
        `       🥹  𝗘𝗥𝗥𝗢𝗥 \n` +
        `   Something went wrong!\n\n` +
        `╚═════✦❘༻༺❘✦═════╝`,
        threadID, messageID
      );
    }
  }
};