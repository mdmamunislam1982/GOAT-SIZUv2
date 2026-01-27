const fs = require("fs");

module.exports = {
  config: {
    name: "v2a",
    aliases: [],
    description: "Convert Video to audio ",
    version: "1.2",
    author: "SiFu",
    countDown: 60,
   longDescription: {
      vi: "",
      en: "Reply to a video"
     },

    category: "converter",
    guide: {
      en: "{p}{n}"
    }

  },
  onStart: async function ({ api, event, args, message }) {
    try {
      const axios = require("axios");
      const fs = require("fs-extra");

      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        api.sendMessage("Please reply to a video message to convert it to audio.", event.threadID, event.messageID);
        return;
      }

      const att = event.messageReply.attachments[0];
      if (att.type !== "video") {
        api.sendMessage("The replied content must be a video.", event.threadID, event.messageID);
        return;
      }

      const { data } = await axios.get(att.url, { method: 'GET', responseType: 'arraybuffer' });
      fs.writeFileSync(__dirname + "/assets/vdtoau.m4a", Buffer.from(data, 'utf-8'));

      const audioReadStream = fs.createReadStream(__dirname + "/assets/vdtoau.m4a");
      const msg = { body: "", attachment: [audioReadStream] };
      api.sendMessage(msg, event.threadID, event.messageID);
    } catch (e) {
      console.log(e);
    }
  },
};