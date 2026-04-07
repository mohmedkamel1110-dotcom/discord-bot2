const { getDB } = require('./database');
const { EmbedBuilder } = require("discord.js");

// 🔥 نظم XP
async function handleXP(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    let user = await users.findOne({ userId });

    if (!user) {
        user = { userId, xp: 0, level: 1 };
        await users.insertOne(user);
    }

    // ✅ تم التعديل: 80 XP لكل رسالة
    user.xp += 80;

    const neededXP = user.level * 100;

    if (user.xp >= neededXP) {
        user.level++;
        user.xp = 0;

        message.channel.send(`🔥 ${message.author} وصل Level ${user.level} 😈`);
    }

    await users.updateOne(
        { userId },
        { $set: { xp: user.xp, level: user.level } }
    );
}

// 🔥 XP Bar
function createXPBar(xp, neededXP) {
    const percentage = xp / neededXP;
    const totalBars = 10;
    const filledBars = Math.round(percentage * totalBars);
    const emptyBars = totalBars - filledBars;

    const bar = "█".repeat(filledBars) + "░".repeat(emptyBars);
    const percentText = Math.round(percentage * 100);

    return `${bar} ${percentText}%`;
}

// 👑 حساب الرانك
async function getRank(users, userId) {
    const allUsers = await users.find().sort({ level: -1, xp: -1 }).toArray();

    const index = allUsers.findIndex(u => u.userId === userId);

    return index === -1 ? "?" : index + 1;
}

// 📊 عرض الليفل
async function getLevel(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    const user = await users.findOne({ userId });

    if (!user) {
        return message.reply("😈 أنت لسه Level 0... ابدأ اكتب!");
    }

    const level = user.level;
    const xp = user.xp;
    const neededXP = level * 100;

    const name = message.member?.displayName || message.author.username;

    const xpBar = createXPBar(xp, neededXP);

    // 👑 الرانك
    const rank = await getRank(users, userId);

    const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setAuthor({
            name: `📊 إحصائيات ${name}`,
            iconURL: message.author.displayAvatarURL()
        })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
            {
                name: "⭐ المستوى",
                value: `\`${level}\``,
                inline: true
            },
            {
                name: "👑 الرتبة",
                value: `\`#${rank}\``,
                inline: true
            },
            {
                name: "✨ النقاط",
                value: `\`${xp} / ${neededXP}\`\n${xpBar}`,
                inline: false
            }
        )
        .setFooter({ text: "Devil Bot 😈" });

    message.reply({ embeds: [embed] });
}

module.exports = { handleXP, getLevel };