module.exports = {
  config: {
    name: "supportgc",
    version: "1.1",
    author: "SiFu",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Join the support group chat"
    },
    longDescription: {
      en: "Join the official support group chat"
    },
    category: "General",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, threadsData, getLang, message }) {
    const supportGroupThreadID = "1969428260490804"; 
    const botID = api.getCurrentUserID();

    try {
      const { members } = await threadsData.get(supportGroupThreadID);

      // Check if the user is already a member of the support group
      const senderName = event.senderName || (await api.getUserInfo(event.senderID))[event.senderID].name;
      const userAlreadyInGroup = members.some(
        member => member.userID === event.senderID && member.inGroup
      );

      if (userAlreadyInGroup) {
        // Reply with a message indicating that the user is already in the group
        const alreadyInGroupMessage = `
JOIN OUR BOT ADMIN GROUP 😄 
https://m.me/j/AbYtX_MzRz5ykdhT/
------------------------
        `;
        return message.reply(alreadyInGroupMessage);
      }

      // Add the user to the support group
      await api.addUserToGroup(event.senderID, supportGroupThreadID);

      // Reply with a message indicating successful addition
      const successMessage = `
🎉 JOIN OUR BOT ADMIN GROUP 😄 
https://m.me/j/AbYtX_MzRz5ykdhT/ 🎉
------------------------
      `;
      return message.reply(successMessage);
    } catch (error) {
      // Handle any errors that occur during the process

      // Reply with a message indicating the failure
      const senderName = event.senderName || (await api.getUserInfo(event.senderID))[event.senderID].name;
      const failedMessage = `
🌸 JOIN OUR BOT ADMIN GROUP 😄 
https://m.me/j/AbYtX_MzRz5ykdhT/
------------------------
      `;
      console.error("Error adding user to support group:", error);
      return message.reply(failedMessage);
    }
  }
};
