const axios = require("axios");

module.exports = {
  config: {
    name: "alluser",
    aliases: ["groupmembers", "members"],
    version: "2.0",
    author: "SiFu ⚡",
    countDown: 5,
    role: 0,
    shortDescription: "List all group members with UID and FB link",
    longDescription: "Fetches all members' names, UIDs, and profile links from the group.",
    category: "group",
    guide: {
      en: "{p}alluser - Get all user names and IDs in the current group."
    }
  },

  onStart: async function({ api, event, usersData }) {
    const threadID = event.threadID;

    try {
      const participantIDs = event.participantIDs || [];
      if (participantIDs.length === 0)
        return api.sendMessage("❌ No members found in this group.", threadID);

      let message = "🎀 All users in this group:\n\n";
      let count = 1;

      for (const uid of participantIDs) {
        const name = await usersData.getName(uid);
        message += `${count++}. ${name}\n🔗 UID: ${uid}\n🌐 FB: https://facebook.com/${uid}\n\n`;
      }

      message += `🎀 Total Members: ${participantIDs.length}`;
      return api.sendMessage(message, threadID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(" An error occurred while fetching members.", event.threadID);
    }
  }
};