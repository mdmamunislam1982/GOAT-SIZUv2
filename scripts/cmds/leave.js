const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "leave",
    aliases: ["leavegc"],
    version: "3.0",
    author: "SiFu",
    countDown: 5,
    role: 2, // Admin only
    shortDescription: "Interactive group list & leave manager",
    longDescription: "Manage group chats the bot is in with a beautiful UI and pagination.",
    category: "admin",
    guide: {
      en: "{pn} - List all groups\n{pn} all - Leave all groups (Caution!)",
    },
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // "leave all" is disabled to prevent accidental mass leave
    if (args[0] === "all") {
      return api.sendMessage(`🚫 The "leave all" command is disabled to prevent accidental mass leave. Please use the leave command with specific group numbers instead.`, threadID);
    }

    try {
      const groupList = await api.getThreadList(500, null, ['INBOX']);
      const filteredList = groupList.filter(group => group.threadName !== null && group.isGroup);

      if (filteredList.length === 0) {
        return api.sendMessage('📭 No group chats found in the inbox.', threadID, messageID);
      }

      return this.sendGroupList(api, threadID, filteredList, 0, senderID);

    } catch (error) {
      console.error("Error listing group chats", error);
      api.sendMessage("❌ Error fetching group list.", threadID);
    }
  },

  sendGroupList: async function (api, threadID, list, start, authorID) {
    const limit = 10; // এক পেজে ১০টি গ্রুপ দেখাবে
    const end = Math.min(start + limit, list.length);
    const currentGroups = list.slice(start, end);

    let message = `╭━━━━『 𝐆𝐂 𝐋𝐈𝐒𝐓 』━━━━━╮\n`;
    currentGroups.forEach((group, index) => {
      message += `┃ ${start + index + 1}. ${group.threadName.substring(0, 25)}\n┃ 🆔 ID: ${group.threadID}\n┣━━━━━━━━━━━━━━━━━━━━━━━\n`;
    });

    message += `┃ 📄 Page: ${Math.floor(start / limit) + 1} / ${Math.ceil(list.length / limit)}\n`;
    message += `┃ 👥 Total Groups: ${list.length}\n╰━━━━━━━━━━━━━━━━╯\n\n`;
    message += `💡 Reply with [Number] to leave.\n💡 Reply [next] or [prev] to navigate.`;

    const sentMessage = await api.sendMessage(message, threadID);
    
    global.GoatBot.onReply.set(sentMessage.messageID, {
      commandName: this.config.name,
      messageID: sentMessage.messageID,
      author: authorID,
      start: start,
      fullList: list
    });
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, start, fullList, messageID: oldMsgID } = Reply;
    if (event.senderID !== author) return;

    const input = args[0].toLowerCase();
    const limit = 10;

    // নেভিগেশন লজিক
    if (input === "next") {
      const nextStart = start + limit;
      if (nextStart >= fullList.length) return api.sendMessage("🦫 This is the last page.", event.threadID, event.messageID);
      api.unsendMessage(oldMsgID);
      return this.sendGroupList(api, event.threadID, fullList, nextStart, author);
    }

    if (input === "prev" || input === "previous") {
      const prevStart = Math.max(start - limit, 0);
      if (start === 0) return api.sendMessage("🎀 You are already on the first page.", event.threadID, event.messageID);
      api.unsendMessage(oldMsgID);
      return this.sendGroupList(api, event.threadID, fullList, prevStart, author);
    }

    // গ্রুপ লিভ নেওয়ার লজিক
    const index = parseInt(input) - 1;
    if (!isNaN(index) && index >= 0 && index < fullList.length) {
      const selected = fullList[index];
      try {
        await api.removeUserFromGroup(api.getCurrentUserID(), selected.threadID);
        api.sendMessage(`🎀 \n\n Left Group: ${selected.threadName}`, event.threadID);
        
        // লিস্ট থেকে ওই গ্রুপ সরিয়ে নতুন লিস্ট আপডেট করা
        const newList = fullList.filter(g => g.threadID !== selected.threadID);
        api.unsendMessage(oldMsgID);
        if (newList.length > 0) {
            this.sendGroupList(api, event.threadID, newList, start >= newList.length ? Math.max(0, start - limit) : start, author);
        }
      } catch (err) {
        api.sendMessage(`🎀 \n Failed to leave: ${selected.threadName}`, event.threadID);
      }
    } else {
      api.sendMessage("🎀 Invalid selection. Please reply with a valid number.", event.threadID);
    }
  }
};