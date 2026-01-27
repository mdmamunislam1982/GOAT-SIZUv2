const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "fish",
    version: "1.1.0",
    author: "SHIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "Catch and sell fish for money",
    longDescription: "Go fishing to earn money (with cooldown)",
    category: "economy",
    guide: "{pn}",
  },

  onStart: async function ({ event, message, usersData }) {
    const cooldownTime = 1000 * 60 * 20; // 20 minutes cooldown
    const userData = await usersData.get(event.senderID);
    const lastWork = userData.data?.fishTime || 0;

    // Check cooldown
    if (Date.now() - lastWork < cooldownTime) {
      const timeLeft = cooldownTime - (Date.now() - lastWork);
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);

      return message.reply(
        `🎣 তুমি ইতিমধ্যে মাছ ধরেছ!\nদয়া করে আবার চেষ্টা করো ${minutes} মিনিট ${seconds} সেকেন্ড পরে।`
      );
    }

    // Random reward
    const reward = Math.floor(Math.random() * 8000) + 1000;
    const fishList = [
      "তিমি মাছ",
      "ইলিশ মাছ",
      "কাতলা মাছ",
      "পাঙ্গাস মাছ",
      "চিংড়ি মাছ",
      "পুটি মাছ",
    ];
    const fish = fishList[Math.floor(Math.random() * fishList.length)];

    // Update user data
    await usersData.set(event.senderID, {
      money: userData.money + reward,
      data: {
        ...userData.data,
        fishTime: Date.now(),
      },
    });

    const time = moment.tz("Asia/Dhaka").format("hh:mm A");
    return message.reply(
      `🐟 তুমি ${fish} ধরেছো এবং বিক্রি করেছো ${reward.toLocaleString()}$!\n⏰ সময়: ${time}`
    );
  },
};