const fs = require("fs-extra");

module.exports = {
        config: {
                name: "setlang",
                version: "1.5",
                author: "NTKhang",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Cài đặt ngôn ngữ của bot cho nhóm chat hiện tại hoặc tất cả các nhóm chat",
                        en: "Set default language of bot for current chat or all chats",
                        bn: "বর্তমান চ্যাট বা সমস্ত চ্যাটের জন্য বটের ডিফল্ট ভাষা সেট করুন",
                        ar: "تعيين اللغة الافتراضية للبوت للمحادثة الحالية أو جميع المحادثات",
                        id: "Atur bahasa default bot untuk chat saat ini atau semua chat"
                },
                category: "owner",
                guide: {
                        vi: "   {pn} <language code ISO 639-1"
                                + "\n   Ngôn ngữ có sẵn: en, vi, bn, ar, id"
                                + "\n   Ví dụ:"
                                + "\n    {pn} en"
                                + "\n    {pn} vi"
                                + "\n    {pn} bn"
                                + "\n    {pn} ar"
                                + "\n    {pn} id",
                        en: "   {pn} <language code ISO 639-1"
                                + "\n   Available languages: en, vi, bn, ar, id"
                                + "\n   Example:"
                                + "\n    {pn} en"
                                + "\n    {pn} vi"
                                + "\n    {pn} bn"
                                + "\n    {pn} ar"
                                + "\n    {pn} id",
                        bn: "   {pn} <language code ISO 639-1"
                                + "\n   উপলব্ধ ভাষা: en, vi, bn, ar, id"
                                + "\n   উদাহরণ:"
                                + "\n    {pn} en"
                                + "\n    {pn} vi"
                                + "\n    {pn} bn"
                                + "\n    {pn} ar"
                                + "\n    {pn} id",
                        ar: "   {pn} <language code ISO 639-1"
                                + "\n   اللغات المتاحة: en, vi, bn, ar, id"
                                + "\n   مثال:"
                                + "\n    {pn} en"
                                + "\n    {pn} vi"
                                + "\n    {pn} bn"
                                + "\n    {pn} ar"
                                + "\n    {pn} id",
                        id: "   {pn} <language code ISO 639-1"
                                + "\n   Bahasa yang tersedia: en, vi, bn, ar, id"
                                + "\n   Contoh:"
                                + "\n    {pn} en"
                                + "\n    {pn} vi"
                                + "\n    {pn} bn"
                                + "\n    {pn} ar"
                                + "\n    {pn} id"
                }
        },

        langs: {
                vi: {
                        setLangForAll: "Đã cài đặt ngôn ngữ mặc định cho bot là: %1",
                        setLangForCurrent: "Đã cài đặt ngôn ngữ mặc định cho nhóm chat này là: %1",
                        noPermission: "Chỉ admin bot mới có thể sử dụng lệnh này",
                        langNotFound: "Không tìm thấy ngôn ngữ: %1"
                },
                en: {
                        setLangForAll: "Set default language of bot to: %1",
                        setLangForCurrent: "Set default language for current chat: %1",
                        noPermission: "Only bot admin can use this command",
                        langNotFound: "Can't find language: %1"
                },
                bn: {
                        setLangForAll: "বটের ডিফল্ট ভাষা সেট করা হয়েছে: %1",
                        setLangForCurrent: "এই চ্যাটের জন্য ডিফল্ট ভাষা সেট করা হয়েছে: %1",
                        noPermission: "শুধুমাত্র বট অ্যাডমিন এই কমান্ড ব্যবহার করতে পারবে",
                        langNotFound: "ভাষা খুঁজে পাওয়া যায়নি: %1"
                },
                ar: {
                        setLangForAll: "تم تعيين اللغة الافتراضية للبوت إلى: %1",
                        setLangForCurrent: "تم تعيين اللغة الافتراضية لهذه المحادثة: %1",
                        noPermission: "فقط مسؤول البوت يمكنه استخدام هذا الأمر",
                        langNotFound: "لا يمكن العثور على اللغة: %1"
                },
                id: {
                        setLangForAll: "Bahasa default bot diatur ke: %1",
                        setLangForCurrent: "Bahasa default untuk chat ini diatur ke: %1",
                        noPermission: "Hanya admin bot yang dapat menggunakan perintah ini",
                        langNotFound: "Bahasa tidak ditemukan: %1"
                }
        },

        onStart: async function ({ message, args, getLang, threadsData, role, event }) {
                if (!args[0])
                        return message.SyntaxError;
                let langCode = args[0].toLowerCase();
                if (langCode == "default" || langCode == "reset")
                        langCode = null;

                if (["-g", "-global", "all"].includes(args[1]?.toLowerCase())) {
                        if (role < 2)
                                return message.reply(getLang("noPermission"));
                        const pathLanguageFile = `${process.cwd()}/languages/${langCode}.lang`;
                        if (!fs.existsSync(pathLanguageFile))
                                return message.reply(getLang("langNotFound", langCode));
                        const readLanguage = fs.readFileSync(pathLanguageFile, "utf-8");
                        const languageData = readLanguage
                                .split(/\r?\n|\r/)
                                .filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line != "");

                        global.language = {};
                        for (const sentence of languageData) {
                                const getSeparator = sentence.indexOf('=');
                                const itemKey = sentence.slice(0, getSeparator).trim();
                                const itemValue = sentence.slice(getSeparator + 1, sentence.length).trim();
                                const head = itemKey.slice(0, itemKey.indexOf('.'));
                                const key = itemKey.replace(head + '.', '');
                                const value = itemValue.replace(/\\n/gi, '\n');
                                if (!global.language[head])
                                        global.language[head] = {};
                                global.language[head][key] = value;
                        }
                        global.GoatBot.config.language = langCode;
                        fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
                        return message.reply(getLang("setLangForAll", langCode));
                }

                await threadsData.set(event.threadID, langCode, "data.lang");
                return message.reply((global.GoatBot.commands.get("setlang")?.langs[langCode]?.setLangForCurrent || "Set default language for current chat: %1").replace("%1", langCode));
        }
};