const { getDB } = require('./database');
const { AttachmentBuilder } = require("discord.js");
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

    // ✅ 80 XP
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

// 🎨 LEVEL CARD
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

    const canvas = Canvas.createCanvas(900, 300);
    const ctx = canvas.getContext("2d");

    // 🖤 خلفية Gradient
    const gradient = ctx.createLinearGradient(0, 0, 900, 0);
    gradient.addColorStop(0, "#0f2027");
    gradient.addColorStop(1, "#2c5364");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 👤 صورة دائرية
    const avatar = await Canvas.loadImage(
        message.author.displayAvatarURL({ extension: "png" })
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 150, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 40, 70, 160, 160);
    ctx.restore();

    // 🧠 الاسم
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(message.author.username, 250, 100);

    // ⭐ Level
    ctx.font = "24px sans-serif";
    ctx.fillText(`Level: ${level}`, 250, 150);

    // 👑 Rank
    ctx.fillText(`Rank: #${rank}`, 250, 190);

    // 🔥 XP BAR (احترافي)
    const barX = 250;
    const barY = 220;
    const barWidth = 500;
    const barHeight = 30;

    // خلفية البار
    ctx.fillStyle = "#555";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // التقدم
    const progress = (xp / neededXP) * barWidth;

    const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    barGradient.addColorStop(0, "#00ffcc");
    barGradient.addColorStop(1, "#00bfff");

    ctx.fillStyle = barGradient;
    ctx.fillRect(barX, barY, progress, barHeight);

    // نص XP
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px sans-serif";
    ctx.fillText(`${xp} / ${neededXP}`, barX, barY - 10);

    // 📦 إرسال
    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: "level.png"
    });

    message.reply({ files: [attachment] });
}

module.exports = { handleXP, getLevel };