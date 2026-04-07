const { getDB } = require('./database');
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");

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

    // ✅ 80 XP لكل رسالة
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

// 📊 عرض الليفل (Canvas + Embed)
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

    const rank = await getRank(users, userId);

    // ================= 🎨 CANVAS =================
    const canvas = Canvas.createCanvas(800, 250);
    const ctx = canvas.getContext("2d");

    // 🖤 خلفية
    ctx.fillStyle = "#1e1e2f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 👤 صورة
    const avatar = await Canvas.loadImage(
        message.author.displayAvatarURL({ extension: "png" })
    );

    ctx.drawImage(avatar, 30, 50, 150, 150);

    // 🧠 الاسم
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px sans-serif";
    ctx.fillText(name, 200, 60);

    // ⭐ Level
    ctx.font = "24px sans-serif";
    ctx.fillText(`Level: ${level}`, 200, 110);

    // 👑 Rank
    ctx.fillText(`Rank: #${rank}`, 200, 145);

    // 🔥 XP Bar
    const barWidth = 400;
    const barHeight = 25;
    const x = 200;
    const y = 180;

    ctx.fillStyle = "#444";
    ctx.fillRect(x, y, barWidth, barHeight);

    const progress = (xp / neededXP) * barWidth;

    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(x, y, progress, barHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px sans-serif";
    ctx.fillText(`${xp} / ${neededXP}`, x, y - 5);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: "level.png"
    });

    // ================= 📊 EMBED =================
    const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setAuthor({
            name: `📊 إحصائيات ${name}`,
            iconURL: message.author.displayAvatarURL()
        })
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

    // 🔥 إرسال الاتنين مع بعض
    message.reply({
        embeds: [embed],
        files: [attachment]
    });
}

module.exports = { handleXP, getLevel };