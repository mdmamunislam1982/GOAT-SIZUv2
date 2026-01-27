const axios = require("axios");
const fs = require("fs-extra");
const tinyurl = require("tinyurl");

// API URL Fetcher
const baseApiUrl = async () => {
    try {
        const base = await axios.get("https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json");
        return base.data.xnil2;
    } catch (e) {
        return "https://api.nayan-project.vercel.app"; // Fallback URL if Github fails
    }
};

const config = {
    name: "autodl",
    version: "3.5",
    author: "SiFu", // Fixed by AI
    credits: "Dipto & SiFu",
    description: "Auto download videos/images from TikTok, YouTube, FB, IG and more.",
    category: "media",
    commandCategory: "media",
    usePrefix: true,
    prefix: true,
    dependencies: {
        "tinyurl": "",
        "fs-extra": ""
    }
};

const onStart = () => {};

const onChat = async ({ api, event }) => {
    const body = event.body?.trim();
    if (!body) return;

    const supportedSites = [
        "https://vt.tiktok.com", "https://www.tiktok.com/", "https://vm.tiktok.com",
        "https://www.facebook.com", "https://fb.watch",
        "https://www.instagram.com/", "https://www.instagram.com/p/",
        "https://youtu.be/", "https://www.youtube.com/", "https://youtube.com/watch",
        "https://x.com/", "https://twitter.com/", "https://pin.it/"
    ];

    // Check if the message contains a supported link
    if (!supportedSites.some(site => body.includes(site))) return;

    // Send waiting message
    const waitMsg = await api.sendMessage("🍓 ᴘʟᴇᴀsᴇ ʜᴏʟᴅ ᴏɴ...!", event.threadID);
    const startTime = Date.now();

    try {
        const baseUrl = await baseApiUrl();
        const apiUrl = `${baseUrl}/alldl?url=${encodeURIComponent(body)}`;
        
        const { data } = await axios.get(apiUrl);
        const content = data?.content || data?.data; // Added extra check

        const mediaLink = content?.result || content?.url || content?.high; // Added extra check for different API responses
        
        if (!mediaLink) {
            api.unsendMessage(waitMsg.messageID);
            return api.sendMessage("🍓 ᴜɴᴀʙʟᴇ ᴛᴏ ʀᴇᴛʀɪᴇᴠᴇ ᴍᴇᴅɪᴀ..!", event.threadID, event.messageID);
        }

        // Determine file type
        let extension = ".mp4";
        let mediaIcon = "🎬";
        let mediaLabel = "Video";

        if (mediaLink.includes(".jpg") || mediaLink.includes(".jpeg")) {
            extension = ".jpg";
            mediaIcon = "🖼️";
            mediaLabel = "Photo";
        } else if (mediaLink.includes(".png")) {
            extension = ".png";
            mediaIcon = "🖼️";
            mediaLabel = "Photo";
        }

        // Prepare File Path
        const fileName = `media-${event.senderID}-${Date.now()}${extension}`;
        const filePath = `${__dirname}/cache/${fileName}`;
        fs.ensureDirSync(`${__dirname}/cache`);

        // Download Media
        const buffer = await axios.get(mediaLink, { responseType: "arraybuffer" }).then(res => res.data);
        fs.writeFileSync(filePath, Buffer.from(buffer, "binary"));

        // Calculation
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Remove wait message
        api.unsendMessage(waitMsg.messageID);

        // Stylish Message (Fixed Variables)
        const stylishMessage = `
╭────────🎀────────╮
     𝐀𝐔𝐓𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑
╰────────🎀────────╯

      ❒ ᴛʏᴘᴇ: ${mediaLabel}
      ❒ 𝐒𝐭𝐚𝐭𝐮𝐬: ᴄᴏᴍᴘʟᴇᴛᴇᴅ
      ❒ sᴘᴇᴇᴅ: ${duration}s

       ✨ 𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐦𝐞𝐝𝐢𝐚!
━━━━━━━━━━━━━━━━━━━━
        ♡—͟͞͞🌊 ʸᵒᵘʳ sɪᴢᴜ 🦋 ⸙ ${mediaLabel.toLowerCase()}
`;

        // Send Final Message
        await api.sendMessage({
            body: stylishMessage,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

    } catch (err) {
        console.error("[autodl] Error:", err);
        api.unsendMessage(waitMsg.messageID); // Remove wait message on error
        
        const errorMsg = `
😿 Oops! Something went wrong.
━━━━━━━━━━━━━━━
• Error: ${err.message}
• Try again later.
━━━━━━━━━━━━━━━`;

        api.sendMessage(errorMsg, event.threadID, event.messageID);
    }
};

module.exports = {
    config,
    onStart,
    onChat,
    run: onStart,
    handleEvent: onChat
};