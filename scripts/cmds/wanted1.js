const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "wanted1",
    aliases: ["wan1"],
    version: "2.7",
    author: "sifu",
    countDown: 5,
    role: 0,
    shortDescription: "Create a wanted poster",
    longDescription: "Generate a stylish wanted poster. Use 'wanted1' for random users, or reply to include specific people.",
    category: "fun",
    guide: "{pn} or reply to a message"
  },

  onStart: async function ({ message, event, api }) {
    // Stylish Font Helper (Kept only for Loading/Error messages)
    const stylish = (text) => {
      const fonts = {
        "LOADING": "☠️ 𝐏𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐲𝐨𝐮𝐫 𝐫𝐞𝐪𝐮𝐞𝐬𝐭...",
        "ERROR": "😿 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝!"
      };
      return fonts[text] || text;
    };

    const { senderID, threadID } = event;
    
    // 1. Get Thread Info to find participants
    let threadInfo;
    try {
        threadInfo = await api.getThreadInfo(threadID);
    } catch (err) {
        threadInfo = { participantIDs: [senderID] };
    }

    let participantIDs = threadInfo.participantIDs.filter(id => id != senderID);

    // 2. Start the users list with the Sender
    let users = [senderID];

    // 3. Handle logic: Reply vs Tags vs Random
    if (event.messageReply) {
        const replyID = event.messageReply.senderID;
        if (!users.includes(replyID)) {
            users.push(replyID);
        }
        participantIDs = participantIDs.filter(id => id != replyID);
    } else if (Object.keys(event.mentions).length > 0) {
        const mentions = Object.keys(event.mentions);
        users.push(...mentions);
        participantIDs = participantIDs.filter(id => !mentions.includes(id));
    }

    // 4. Fill remaining slots with random users up to 3
    while (users.length < 3) {
        if (participantIDs.length > 0) {
            const randomIndex = Math.floor(Math.random() * participantIDs.length);
            const randomUser = participantIDs[randomIndex];
            users.push(randomUser);
            participantIDs.splice(randomIndex, 1);
        } else {
            users.push(senderID);
        }
    }

    const [one, two, three] = users.slice(0, 3);

    try {
      const waitMsg = await message.reply(stylish("LOADING"));
      const imagePath = await createWantedImage(one, two, three);
      
      // Sending ONLY the attachment, no extra text
      await message.reply({
        attachment: fs.createReadStream(imagePath)
      });
      
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      
      try { api.unsendMessage(waitMsg.messageID); } catch(e) {}
    } catch (error) {
      console.error("Error:", error);
      message.reply(stylish("ERROR"));
    }
  }
};

async function createWantedImage(one, two, three) {
  const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662"; 
  const getAvatar = (id) => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=${token}`;

  try {
    const [avatarOne, avatarTwo, avatarThree, background] = await Promise.all([
      jimp.read(getAvatar(one)),
      jimp.read(getAvatar(two)),
      jimp.read(getAvatar(three)),
      jimp.read("https://i.ibb.co/7yPR6Xf/image.jpg")
    ]);

    background
      .resize(2452, 1226)
      .composite(avatarOne.resize(405, 405), 206, 345)   // Left
      .composite(avatarThree.resize(450, 450), 1010, 315) // Center
      .composite(avatarTwo.resize(400, 400), 1830, 350); // Right

    const imagePath = `wanted_${Date.now()}.png`;
    await background.writeAsync(imagePath);
    return imagePath;
  } catch (e) {
    throw new Error("Failed to process images");
  }
}