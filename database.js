const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

let db;

async function connectDB() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db("discordBot");
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Error:", err.message);
    }
}

function getDB() {
    return db;
}

module.exports = { connectDB, getDB };