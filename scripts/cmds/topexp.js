module.exports = {
  config: {
    name: "topexp",
    aliases: ["toprank", "ranktop", "ranking", "leveltop", "toplevel"],
    version: "4.0",
    author: "SiFu",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "🎖️ Show EXP rank or mentioned user's stats"
    },
    longDescription: {
      en: "Show top 10 EXP users or the EXP/level of a mentioned user"
    },
    category: "Box chat",
    guide: {
      en: "{pn} — Show top 10 ranked users\n{pn} @mention — Show EXP and level of mentioned user"
    }
  },

  onStart: async function ({ message, event, usersData, args }) {
    const deltaNext = 5;
    const allUsers = await usersData.getAll();

    const mentionIDs = Object.keys(event.mentions || {});

    // ============ Handle Mentioned User ============
    if (mentionIDs.length > 0) {
      const results = [];

      for (const id of mentionIDs) {
        const user = await usersData.get(id);
        const exp = user.exp || 0;
        const level = Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
        results.push(`🎀 Name: ${user.name}\n🧬 Level: ${level}\n✨ EXP: ${exp.toLocaleString()}`);
      }

      return message.reply(`🎀 𝙐𝙨𝙚𝙧 𝙎𝙩𝙖𝙩𝙨:\n\n${results.join("\n\n")}`);
    }

    // ============ Handle Top 10 ============
    const withExp = allUsers.filter(u => u.exp > 0);
    if (withExp.length === 0)
      return message.reply("🐳 No users have gained any EXP yet!");

    const sorted = withExp.sort((a, b) => (b.exp || 0) - (a.exp || 0)).slice(0, 10);

    const rankEmoji = [
      "👑", "🥈", "🥉", "🎖️", "🎖️",
      "🏅", "🏅", "🏅", "🎯", "🎯"
    ];

    const leaderboard = sorted.map((user, i) => {
      const exp = user.exp || 0;
      const level = Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
      const emoji = rankEmoji[i] || "🎗️";
      return `${emoji} 𝙍𝙖𝙣𝙠 ${i + 1}: ${user.name}\n   ┗ 🧬 𝙇𝙚𝙫𝙚𝙡: ${level} | ✨ 𝙓𝙋: ${exp.toLocaleString()}`;
    });

    const msg = `╭────────────────╮
┃     𝐓𝐎𝐏 𝟏𝟎 𝐑𝐀𝐍𝐊𝐄𝐑𝐒      ┃
╰────────────────╯
${leaderboard.join("\n\n")}
─────────────────
💬 𝑲𝒆𝒆𝒑 𝑪𝒉𝒂𝒕𝒕𝒊𝒏𝒈 & 𝑳𝒆𝒗𝒆𝒍 𝑼𝒑!
━━━━━━━━━━━━━━━━━`;

    return message.reply(msg);
  }
};