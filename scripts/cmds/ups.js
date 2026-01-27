const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
    config: {
        name: "ups",
        version: "1.2",
        author: "SiFu",
        countDown: 5,
        role: 2,
        shortDescription: {
            en: ""
        },
        longDescription: {
            en: "get information."
        },
        category: "upsystem",
        guide: {
            en: "{pn}"
        }
    },

    onStart: async function ({ message, event, api, usersData, threadsData }) {
        const gifURLs = [
            "https://i.ibb.co/Gk4MzRf/image.gif",
            "https://i.ibb.co/nj0ysh5/image.gif"
        ];

        const randomGifURL = gifURLs[Math.floor(Math.random() * gifURLs.length)];
        const gifAttachment = await global.utils.getStreamFromURL(randomGifURL);

        const uptime = process.uptime();
        const s = Math.floor(uptime % 60);
        const m = Math.floor((uptime / 60) % 60);
        const h = Math.floor((uptime / (60 * 60)) % 24);
        const upSt = `${h}Hrs ${m}Min ${s}Sec`;

        let threadInfo = await api.getThreadInfo(event.threadID);

        const genderb = [];
        const genderg = [];
        const nope = [];

        for (let z in threadInfo.userInfo) {
            const gioitinhone = threadInfo.userInfo[z].gender;
            const nName = threadInfo.userInfo[z].name;

            if (gioitinhone === "MALE") {
                genderb.push(z + gioitinhone);
            } else if (gioitinhone === "FEMALE") {
                genderg.push(gioitinhone);
            } else {
                nope.push(nName);
            }
        }

        const b = genderb.length;
        const g = genderg.length;
        const u = await usersData.getAll();
        const t = await threadsData.getAll();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const diskUsage = await getDiskUsage();
        const system = `${os.platform()} ${os.release()}`;
        const model = `${os.cpus()[0].model}`;
        const cores = `${os.cpus().length}`;
        const arch = `${os.arch()}`;
        const processMemory = prettyBytes(process.memoryUsage().rss);

        const a = {
            body: `🐿 | Prefix: 「 ${global.GoatBot.config.prefix} 」\n🏃 | Bot Running: ${upSt}\n💁‍♂ | Boys: ${b}\n💁‍♀ | Girls: ${g}\n🏘 | Groups: ${t.length}\n👪 | Users: ${u.length}\n📡 | OS: ${system}\n📱 | Model: ${model}\n🛡 | Cores: ${cores}\n🗄 | Architecture: ${arch}\n📀 | Disk Information:\n        ${generateProgressBar((diskUsage.used / diskUsage.total) * 100)}\n        Usage: ${prettyBytes(diskUsage.used)}\n        Total: ${prettyBytes(diskUsage.total)}\n💾 | Memory Information:\n        ${generateProgressBar((process.memoryUsage().rss / totalMemory) * 100)}\n        Usage: ${processMemory}\n        Total: ${prettyBytes(totalMemory)}\n🗃 | Ram Information:\n        ${generateProgressBar(((os.totalmem() - os.freemem()) / totalMemory) * 100)}\n        Usage: ${prettyBytes(os.totalmem() - os.freemem())}\n        Total: ${prettyBytes(totalMemory)}`,
            attachment: gifAttachment
        };

        message.reply(a, event.threadID);
    }
};

async function getDiskUsage() {
    const { stdout } = await exec('df -k /');
    const [_, total, used] = stdout.split('\n')[1].split(/\s+/).filter(Boolean);
    return { total: parseInt(total) * 1024, used: parseInt(used) * 1024 };
}

function prettyBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
}

function generateProgressBar(percentage) {
    const totalSections = 10;
    const filledSections = Math.ceil((percentage / 100) * totalSections);

    const progressBar = `[${'█'.repeat(filledSections)}${'▒'.repeat(totalSections - filledSections)}]`;

    return progressBar;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   }
