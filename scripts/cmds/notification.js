const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "1.7",
    author: "NTKhang",
    countDown: 5,
    role: 2,
    description: {
      vi: "Gửi thông báo từ admin đến all box",
      en: "Send notification from admin to all box"
    },
    category: "owner",
    guide: {
      en: "{pn} <message>"
    },
    envConfig: {
      delayPerGroup: 250
    }
  },

  langs: {
    vi: {
      missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi đến tất cả các nhóm",
      notification: "Thông báo từ admin bot đến tất cả nhóm chat (không phản hồi tin nhắn này)",
      sendingNotification: "Bắt đầu gửi thông báo từ admin bot đến %1 nhóm chat",
      sentNotification: "✓ Đã gửi thông báo đến %1 nhóm thành công",
      errorSendingNotification: "Có lỗi xảy ra khi gửi đến %1 nhóm:\n%2"
    },
    en: {
      missingMessage: "Please enter the message you want to send to all groups",
      notification: "Notification from admin bot to all chat groups (do not reply to this message)",
      sendingNotification: "Start sending notification from admin bot to %1 chat groups",
      sentNotification: "✓ Sent notification to %1 groups successfully",
      errorSendingNotification: "An error occurred while sending to %1 groups:\n%2"
    }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang }) {
    const { delayPerGroup } = envCommands[commandName];
    if (!args[0])
      return message.reply(getLang("missingMessage"));

    // STATIC HEADER (fixed)
    const header = `┍━━━━━━━━━━━━━━━━━━━━◊
[🎀] ⦏ɴ⦐⦏ᴏ⦐⦏ᴛ⦐⦏ɪ⦐⦏ꜰ⦐⦏ɪ⦐⦏ᴄ⦐⦏ᴀ⦐⦏ᴛ⦐⦏ɪ⦐⦏ᴏ⦐⦏ɴ⦐
[⚡] ⦏ꜰ⦐⦏ʀ⦐⦏ᴏ⦐⦏ᴍ⦐_⦏ᴄ⦐⦏ᴇ⦐⦏ᴏ⦐  ⦏s⦐⦏ɪ⦐⦏ꜰ⦐⦏ᴜ⦐
┕━━━━━━━━━━━━━━━━━━━━◊`;

    const formSend = {
      body: `${header}\n\n┍━━━━━━━━━━━━━━━━━━━━◊\n\n${args.join(" ")}\n\n┕━━━━━━━━━━━━━━━━━━━━◊`,
      attachment: await getStreamsFromAttachment(
        [
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
      )
    };

    const allThreadID = (await threadsData.getAll())
      .filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);

    message.reply(getLang("sendingNotification", allThreadID.length));

    let sendSucces = 0;
    const sendError = [];
    const pendingSend = [];

    for (const thread of allThreadID) {
      const tid = thread.threadID;
      try {
        pendingSend.push({
          threadID: tid,
          pending: api.sendMessage(formSend, tid)
        });
        await new Promise(resolve => setTimeout(resolve, delayPerGroup));
      }
      catch (e) {
        sendError.push(tid);
      }
    }

    for (const sent of pendingSend) {
      try {
        await sent.pending;
        sendSucces++;
      } catch (e) {
        const { errorDescription } = e;
        let found = sendError.find(item => item.errorDescription == errorDescription);
        if (!found) {
          sendError.push({
            threadIDs: [sent.threadID],
            errorDescription
          });
        } else {
          found.threadIDs.push(sent.threadID);
        }
      }
    }

    let msg = "";
    if (sendSucces > 0)
      msg += getLang("sentNotification", sendSucces) + "\n";
    if (sendError.length > 0)
      msg += getLang(
        "errorSendingNotification",
        sendError.reduce((a, b) => a + b.threadIDs.length, 0),
        sendError.reduce((a, b) => a + `\n - ${b.errorDescription}\n  + ${b.threadIDs.join("\n  + ")}`, "")
      );

    message.reply(msg);
  }
};