module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf"],
    version: "1.0",
    author: "SiFu",
    countDown: 5,
    category: "game",
    guide: { en: "{p}coinflip <head/tail> <amount>" }
  },
  onStart: async function ({ event, api, usersData, args }) {
    const { senderID, threadID, messageID } = event;
    const toFont = (text) => text.split('').map(c => ({"A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉","K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓","U":"𝐔","V":"𝐕","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙","a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣","k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t:":"𝐭","u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳"}[c] || c)).join('');
    
    const choice = args[0]?.toLowerCase();
    if (!['head', 'tail'].includes(choice)) return api.sendMessage("💠 | Choose head or tail!", threadID);

    let user = await usersData.get(senderID);
    const bet = args[1] === 'all' ? user.money : parseInt(args[1]?.replace(/k/i, '000').replace(/m/i, '000000'));
    if (!bet || bet <= 0 || user.money < bet) return api.sendMessage("🚫 | Invalid balance!", threadID);

    const result = Math.random() > 0.5 ? 'head' : 'tail';
    const win = choice === result;
    const winAmt = win ? bet * 2 : 0;
    await usersData.set(senderID, { money: (user.money - bet) + winAmt });

    api.sendMessage(`🪙 | ${toFont("FLIPPING COIN")}...\n━━━━━━━━━━━━━━\n${toFont("Result")}: ${result.toUpperCase()}\n${toFont("Status")}: ${win ? "✅ WON" : "❌ LOST"}\n${toFont("New Bal")}: ${(user.money - bet + winAmt).toLocaleString()}`, threadID);
  }
};