require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { startMessages } = require('./messages');
const { handleXP, getLevel } = require('./levels');
const { getDB, connectDB } = require('./database');

// 🔥 AI (OPENROUTER)
const fetch = require("node-fetch");

// 🔥 ticket system
const { handleTicketInteraction, sendPanel } = require("./ticket");

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// 🔥 DB
connectDB().catch(console.error);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const OWNER_ID = "1215378499393552526";

client.once('ready', async () => {
    console.log(`🔥 Logged in as ${client.user.tag}`);

    try {
        startMessages(client);
        handleTicketInteraction(client, OWNER_ID);
        await sendPanel(client);
    } catch (err) {
        console.error("❌ Ready Error:", err);
    }
});

client.on('messageCreate', async (message) => {
    try {
        if (!message || message.author.bot) return;

        const db = getDB();
        if (!db) return;

        const users = db.collection("users");

        await handleXP(message).catch(() => {});

        const args = message.content.trim().split(/ +/);
        const command = args[0]?.toLowerCase();
        const mentionedUser = message.mentions.users.first();

        // ================== 🤖 AI ==================
        if (message.mentions.has(client.user) || message.reference) {

            let prompt = message.content
                .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
                .trim();

            if (!prompt && message.reference) {
                try {
                    const replied = await message.channel.messages.fetch(message.reference.messageId);
                    prompt = replied.content;
                } catch {}
            }

            if (!prompt) prompt = "اتكلم معاه عادي";

            try {
                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "openchat/openchat-7b", // 🔥 موديل مظبوط
                        max_tokens: 150, // 🔥 يمنع الهبد الطويل
                        messages: [
                            {
                                role: "system",
                                content: `
انت Devil Bot 😈

اتكلم بالمصري العامي بس

ممنوع:
- أي إنجليزي
- أي إسباني
- أي فصحى

اتكلم زي الشباب:
- "عامل ايه يا عم 😂"
- "ايه الأخبار"
- "فينك مختفي ليه 😏"

خليك:
- طبيعي
- خفيف دم
- صاحب جدع

ماتقولش:
- "كيف حالك"
- "أنا هنا لمساعدتك"
- أي كلام رسمي

ردودك قصيرة ومفهومة
اتكلم كأنك واحد صاحب مش AI
`
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ]
                    })
                });

                const data = await res.json();

                if (!data.choices) {
                    console.log("❌ OPENROUTER ERROR:", data);
                    return message.reply(`❌ AI Error: ${JSON.stringify(data)}`);
                }

                let reply = data.choices[0].message.content;

                // 🔥 تنظيف الرد لو فيه أي لغة غريبة
                reply = reply.replace(/[A-Za-z]/g, "");

                return message.reply(reply);

            } catch (err) {
                console.error("❌ AI Error:", err);
                return message.reply("❌ حصل مشكلة في AI");
            }
        }

        if (!command) return;

        // ================== 👤 USER ==================

        if (command === "!ping") {
            return message.reply("🏓 Pong! New");
        }

        if (command === "!level") {
            return await getLevel(message);
        }

        if (command === "!best") {

            const topUsers = await users.find().sort({ level: -1, xp: -1 }).limit(5).toArray();

            if (!topUsers.length) {
                return message.reply("❌ مفيش بيانات");
            }

            let desc = "";

            for (let i = 0; i < topUsers.length; i++) {
                const medal = ["🥇", "🥈", "🥉"][i] || "🔹";
                const u = topUsers[i];
                desc += `${medal} #${i + 1} - <@${u.userId}> (Level ${u.level})\n`;
            }

            let topUser = null;
            let avatar = null;
            let title = "🏆 Best 5 Players";

            try {
                topUser = await client.users.fetch(topUsers[0].userId);
                avatar = topUser.displayAvatarURL({ dynamic: true, size: 1024 });
                title = `👑 ${topUser.username} | Top Player`;
            } catch {}

            const embed = new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle(title)
                .setDescription(desc)
                .setFooter({ text: "Devil Bot 😈" });

            if (avatar) embed.setThumbnail(avatar);
            if (avatar) embed.setImage(avatar);

            return message.reply({ embeds: [embed] });
        }

        // ================== 💀 OWNER ONLY ==================

        const ownerOnly = [
            "!addxp",
            "!rexp",
            "!addlevel",
            "!relevel",
            "!alllevels",
            "!clear",
            "!مستوي"
        ];

        if (ownerOnly.includes(command) && message.author.id !== OWNER_ID) {
            return message.reply("❌ الأمر للأونر فقط 👑");
        }

        // ================== 👑 OWNER ==================

        if (command === "!addxp") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { xp: amount }, $setOnInsert: { level: 1 } },
                { upsert: true }
            );

            return message.reply(`🔥 +${amount} XP`);
        }

        if (command === "!rexp") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { xp: -amount } }
            );

            return message.reply(`💀 -${amount} XP`);
        }

        if (command === "!addlevel") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { level: amount } },
                { upsert: true }
            );

            return message.reply(`👑 +${amount} Level`);
        }

        if (command === "!relevel") {
            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const amount = parseInt(args[2]);
            if (isNaN(amount)) return message.reply("❌ رقم غير صالح");

            await users.updateOne(
                { userId: mentionedUser.id },
                { $inc: { level: -amount } }
            );

            return message.reply(`💀 -${amount} Level`);
        }

        if (command === "!alllevels") {

            const all = await users.find().sort({ level: -1, xp: -1 }).limit(20).toArray();

            let desc = "";
            for (let i = 0; i < all.length; i++) {
                desc += `#${i + 1} <@${all[i].userId}> - Lvl ${all[i].level} | XP ${all[i].xp}\n`;
            }

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("📊 All Users")
                        .setDescription(desc)
                ]
            });
        }

        if (command === "!clear") {
            const amount = parseInt(args[1]);
            if (isNaN(amount)) return;

            await message.channel.bulkDelete(amount, true).catch(() => {});
            return message.channel.send(`💀 Deleted ${amount}`);
        }

        if (command === "!مستوي") {

            if (!mentionedUser) return message.reply("❌ منشن الشخص");

            const userId = mentionedUser.id;

            await users.updateOne(
                { userId },
                { $setOnInsert: { userId, xp: 0, level: 1 } },
                { upsert: true }
            );

            const user = await users.findOne({ userId });

            const level = user.level;
            const xp = user.xp;
            const neededXP = level * 100;

            const percentage = xp / neededXP;
            const bars = Math.round(percentage * 10);
            const xpBar = "█".repeat(bars) + "░".repeat(10 - bars);

            const rank = await users.countDocuments({
                $or: [
                    { level: { $gt: level } },
                    { level: level, xp: { $gt: xp } }
                ]
            }) + 1;

            const embed = new EmbedBuilder()
                .setColor("#2b2d31")
                .setAuthor({
                    name: `📊 مستوى ${mentionedUser.username}`,
                    iconURL: mentionedUser.displayAvatarURL()
                })
                .addFields(
                    { name: "⭐ المستوى", value: `\`${level}\``, inline: true },
                    { name: "👑 الرتبة", value: `\`#${rank}\``, inline: true },
                    { name: "✨ النقاط", value: `\`${xp} / ${neededXP}\`\n${xpBar}` }
                );

            return message.reply({ embeds: [embed] });
        }

    } catch (err) {
        console.error("❌ Message Error:", err);
    }
});

client.login(TOKEN);