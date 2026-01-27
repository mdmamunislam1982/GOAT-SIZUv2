const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair2",
    author: "SiFu",
    countDown: 15,
    role: 0,
    shortDescription: {
      en: "Get to know your partner"
    },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with"
    },
    category: "love",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const { loadImage, createCanvas } = require("canvas");

    // Ensure assets folder exists
    const assetsDir = path.join(__dirname, "assets");
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

    let pathImg = path.join(assetsDir, "background.png");
    let pathAvt1 = path.join(assetsDir, "avt1.png");
    let pathAvt2 = path.join(assetsDir, "avt2.png");

    let id1 = event.senderID;
    let name1 = await usersData.getName(id1);
    let threadInfo = await api.getThreadInfo(event.threadID);
    let all = threadInfo.userInfo;

    let gender1;
    for (let u of all) {
      if (u.id == id1) gender1 = u.gender;
    }

    let botID = api.getCurrentUserID();
    let candidates = [];

    if (gender1 === "FEMALE") {
      for (let u of all) {
        if (u.gender === "MALE" && u.id !== id1 && u.id !== botID)
          candidates.push(u.id);
      }
    } else if (gender1 === "MALE") {
      for (let u of all) {
        if (u.gender === "FEMALE" && u.id !== id1 && u.id !== botID)
          candidates.push(u.id);
      }
    } else {
      for (let u of all) {
        if (u.id !== id1 && u.id !== botID) candidates.push(u.id);
      }
    }

    let id2 = candidates[Math.floor(Math.random() * candidates.length)];
    let name2 = await usersData.getName(id2);

    let rd1 = Math.floor(Math.random() * 100) + 1;
    let cc = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
    let rd2 = cc[Math.floor(Math.random() * cc.length)];

    let resultPool = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1];
    let percentage = resultPool[Math.floor(Math.random() * resultPool.length)];

    let backgroundURL = "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg";

    // Download avatars
    let avt1 = (
      await axios.get(
        `https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avt1));

    let avt2 = (
      await axios.get(
        `https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt2, Buffer.from(avt2));

    // Download background
    let bg = (
      await axios.get(backgroundURL, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(pathImg, Buffer.from(bg));

    // Canvas
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt2);

    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 111, 175, 330, 330);
    ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

    let finalBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, finalBuffer);

    // Cleanup
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    return api.sendMessage(
      {
        body:
          `『💗』Congratulations ${name1}\n` +
          `『❤️』Looks like destiny connected you with ${name2}\n` +
          `『🔗』Your link percentage is ${percentage}%`,
        mentions: [
          { tag: name2, id: id2 },
          { tag: name1, id: id1 }
        ],
        attachment: fs.createReadStream(pathImg)
      },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );
  }
};