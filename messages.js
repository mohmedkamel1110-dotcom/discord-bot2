function startMessages(client) {
    const channelId = "1325277662280945807";

    let lastSentMorning = null;
    let lastSentEvening = null;
    let lastSentDuaa = null;

    setInterval(() => {
        const now = new Date();

        // ⏰ توقيت مصر
        const egyptTime = new Date(
            now.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
        );

        const hours = egyptTime.getHours();
        const minutes = egyptTime.getMinutes();
        const today = egyptTime.toDateString();

        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        // 🌅 صباح الخير (9:00)
        if (hours === 9 && minutes === 0 && lastSentMorning !== today) {
            channel.send("أَصْـبَحْنا وَأَصْـبَحَ المُـلْكُ لله وَالحَمدُ لله ، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُـلكُ ولهُ الحَمْـد، وهُوَ على كلّ شَيءٍ قدير ، رَبِّ أسْـأَلُـكَ خَـيرَ ما في هـذا اليوم وَخَـيرَ ما بَعْـدَه ، وَأَعـوذُ بِكَ مِنْ شَـرِّ ما في هـذا اليوم وَشَرِّ ما بَعْـدَه، رَبِّ أَعـوذُبِكَ مِنَ الْكَسَـلِ وَسـوءِ الْكِـبَر ، رَبِّ أَعـوذُ بِكَ مِنْ عَـذابٍ في النّـارِ وَعَـذابٍ في القَـبْر.");
            lastSentMorning = today;
        }

        // 🌙 مساء الخير (21:00)
        if (hours === 21 && minutes === 0 && lastSentEvening !== today) {
            channel.send("اللّهُـمَّ إِنِّـي أَمسيتُ أُشْـهِدُك ، وَأُشْـهِدُ حَمَلَـةَ عَـرْشِـك ، وَمَلَائِكَتَكَ ، وَجَمـيعَ خَلْـقِك ، أَنَّـكَ أَنْـتَ اللهُ لا إلهَ إلاّ أَنْـتَ وَحْـدَكَ لا شَريكَ لَـك ، وَأَنَّ ُ مُحَمّـداً عَبْـدُكَ وَرَسـولُـك");
            lastSentEvening = today;
        }

        // 🤲 صلاة الفجر (4:32)
        if (hours === 4 && minutes === 32 && lastSentDuaa !== today) {
            channel.send(`صلاة الفجر 🩶

صلاة الفجر لو صاحي اوعي تكسل 💞
قوموا نلحق ركعة تنوّر يومنا  

دعاء بداية اليوم:
اللهم اجعل هذا الصباح فتحًا لنا لكل خير، وبابًا لكل فرج، ونجاة من كل شر.

اللي بيبدأ يومه بالفجر… كسبان من بدري  

صلي  
وادعي  
وسلّمها لربنا  

@everyone`);
            lastSentDuaa = today;
        }

    }, 60000); // كل دقيقة
}

module.exports = { startMessages };