const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const FB_HARDCODED_TOKEN = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
const PALESTINE_API_URL = 'https://nexalo-api.vercel.app/api/palestine-frame-v2';

function getProfilePictureURL(userID, size = [512, 512]) {
  const [height, width] = size;
  return `${GRAPH_API_BASE}/${userID}/picture?width=${width}&height=${height}&access_token=${FB_HARDCODED_TOKEN}`;
}

module.exports.config = {
  name: "palestine1",
  aliases: [],
  version: "1.0",
  author: "SiFu",
  countDown: 5,
  adminOnly: false,
  description: "Add a Palestine frame to your profile picture 🇵🇸",
  category: "Support",
  guide: "{pn}palestine1 [@user]",
  usePrefix: true
};

// FIXED VERSION — NO getText
module.exports.onStart = async function({ api, event }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    let targetID = senderID;
    let targetName = null;

    const mentionIDs = Object.keys(mentions);
    if (mentionIDs.length > 0) {
      targetID = mentionIDs[0];
      targetName = mentions[targetID].replace('@', '').trim();
    }

    if (!targetName) {
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo([senderID], (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      targetName = userInfo[senderID]?.name || "Unknown User";
    }

    const profilePicUrl = getProfilePictureURL(targetID);
    const apiUrl = `${PALESTINE_API_URL}?image=${encodeURIComponent(profilePicUrl)}`;

    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const fileName = `palestine_${crypto.randomBytes(8).toString('hex')}.png`;
    const filePath = path.join(tempDir, fileName);

    const response = await axios.get(apiUrl, {
      responseType: 'stream',
      timeout: 10000
    });

    if (!response.headers['content-type']?.startsWith("image/")) {
      throw new Error("API did not return an image");
    }

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const msg = {
      body: `🇵🇸 Successfully added Palestine frame for ${targetName}!`,
      attachment: fs.createReadStream(filePath)
    };

    if (targetID !== senderID) {
      msg.mentions = [{ tag: `@${targetName}`, id: targetID }];
    }

    await new Promise((resolve, reject) => {
      api.sendMessage(msg, threadID, (err) => {
        if (err) return reject(err);
        api.setMessageReaction("🇵🇸", messageID, () => {}, true);
        resolve();
      }, messageID);
    });

    fs.unlinkSync(filePath);

  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};