module.exports = {
  config: {
    name: "botJoin",
    version: "1.0.0",
    author: "SiFu",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const botID = api.getCurrentUserID();
    const addedUsers = event.logMessageData.addedParticipants || [];

    // Check bot added or not
    const botAdded = addedUsers.find(
      (u) => (u.userFbId || u.userId) == botID
    );
    if (!botAdded) return;

    const threadID = event.threadID;
    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "This Group";
    const prefix = global.GoatBot.config.prefix;

    const message =
`╔═════════════════╗
         🍓 [—͟͟͞͞𝐒𝐈Ꮓ𝐔~緒 ] 🍓
╚═════════════════╝

🌊 𝐇𝐞𝐲 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞!
✨ 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐚𝐝𝐝𝐢𝐧𝐠 𝐦𝐞

━━━━━━━━━━━━━━━━━━
🎀 𝐁𝐨𝐭 𝐏𝐫𝐞𝐟𝐢𝐱 : ,
🎀 𝐀𝐥𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬 : ,help
━━━━━━━━━━━━━━━━━━

🎀 𝐈'𝐦 —͟͟͞͞𝐒𝐈Ꮓ𝐔~緒 𝐁𝐨𝐭
🐳 𝐅𝐚𝐬𝐭 • 🐍 𝐒𝐚𝐟𝐞 • 💀 𝐒𝐦𝐚𝐫𝐭

💖 𝐒𝐭𝐚𝐲 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 & 𝐞𝐧𝐣𝐨𝐲!
━━━━━━━━━━━━━━━━━━
👑 𝐎𝐰𝐧𝐞𝐫 : [ —͟͟͞͞𝐒𝐈𝐅𝐔~緒 ]
🎀 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲: [—͟͟͞͞𝐒𝐈Ꮓ𝐔~緒 ]`;

    try {
      // Auto nickname set
      await api.changeNickname("🍓 [—͟͟͞͞𝐒𝐈Ꮓ𝐔~緒 ] 🍓", threadID, botID);

      await api.sendMessage(message, threadID);
    } catch (e) {
      console.error("Bot Join Event Error:", e);
    }
  }
};
