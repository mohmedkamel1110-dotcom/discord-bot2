const { getDB } = require('./database');
const { AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

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

// 👑 حساب الرانك
async function getRank(users, userId) {
    const allUsers = await users.find().sort({ level: -1, xp: -1 }).toArray();
    const index = allUsers.findIndex(u => u.userId === userId);
    return index === -1 ? "?" : index + 1;
}

// 🎨 عرض الليفل
async function getLevel(message) {
    const db = getDB();
    if (!db) return;

    const users = db.collection("users");
    const userId = message.author.id;

    const user = await users.findOne({ userId });

    if (!user) {
        return message.reply("😈 ابدأ اكتب الأول!");
    }

    const level = user.level;
    const xp = user.xp;
    const neededXP = level * 100;
    const rank = await getRank(users, userId);

    const canvas = createCanvas(900, 300);
    const ctx = canvas.getContext("2d");

    // 🖤 خلفية
    ctx.fillStyle = "#1e1e2f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 👤 صورة دائرية
    const avatar = await loadImage(
        message.author.displayAvatarURL({ extension: "png" })
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 150, 80, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 40, 70, 160, 160);
    ctx.restore();

    // 🧠 الاسم
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(message.author.username, 250, 90);

    // ⭐ Level
    ctx.font = "24px sans-serif";
    ctx.fillText(`Level: ${level}`, 250, 140);

    // 👑 Rank
    ctx.fillText(`Rank: #${rank}`, 250, 180);

    // 🔢 نسبة XP
    const percent = Math.floor((xp / neededXP) * 100);
    ctx.fillText(`${percent}%`, 750, 180);

    // 🔥 XP BAR
    const barX = 250;
    const barY = 220;
    const barWidth = 500;
    const barHeight = 25;

    // خلفية البار
    ctx.fillStyle = "#444";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // التقدم (مع حد أدنى عشان يبان)
    const progress = Math.max(10, (xp / neededXP) * barWidth);

    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(barX, barY, progress, barHeight);

    // نص XP
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px sans-serif";
    ctx.fillText(`${xp} / ${neededXP}`, barX, barY - 5);

    // 📦 إرسال الصورة
    const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
        name: "level.png"
    });

    message.reply({ files: [attachment] });
}

module.exports = { handleXP, getLevel };