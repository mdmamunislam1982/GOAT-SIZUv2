const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pair3",
    version: "1.1",
    author: "SiFu",
    shortDescription: {
      en: "Pair with a random girl in the group 😗",
      vi: ""
    },
    category: "love",
    guide: "{pn}"
  },

  onStart: async function({ event, threadsData, message, usersData }) {
    try {
      const uidI = event.senderID;
      const threadData = await threadsData.get(event.threadID);

      // Filter female members who are currently in the group
      const members = threadData.members.filter(member => member.gender === "FEMALE" && member.inGroup);

      if (members.length === 0) {
        return message.reply("❌ Sorry, I couldn't find any female members in this group to pair you with!");
      }

      const randomIndex = Math.floor(Math.random() * members.length);
      const randomMember = members[randomIndex];
      const uidTarget = randomMember.userID;

      // 🔹 FIX: Using direct Facebook Graph API with Access Token for reliable avatars
      const avatarUrl1 = `https://graph.facebook.com/${uidI}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarUrl2 = `https://graph.facebook.com/${uidTarget}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const name1 = await usersData.getName(uidI);
      const name2 = await usersData.getName(uidTarget);

      const lovePercentage = Math.floor(Math.random() * 36) + 65;
      const compatibilityRatio = Math.floor(Math.random() * 36) + 65;

      message.reply({
        body: `• Everyone congratulate the new couple:\n❤️ ${name1} 💕 ${name2} ❤️\n\nLove percentage: "${lovePercentage}% 🤭"\nCompatibility ratio: "${compatibilityRatio}% 💕"\n\nCongratulations 🥳`, 
        attachment: [
          await getStreamFromURL(avatarUrl1),
          await getStreamFromURL(avatarUrl2)
        ]
      });

    } catch (error) {
      console.error(error);
      message.reply("⚠️ Something went wrong while finding your pair!");
    }
  }
};