const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

const client = new MongoClient(uri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

let db = null;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('gamehub');
    console.log('MongoDB Atlas bağlantısı başarılı');
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('scores').createIndex({ userId: 1, gameId: 1 });
    await db.collection('scores').createIndex({ gameId: 1, score: -1 });
    await db.collection('rooms').createIndex({ gameId: 1, status: 1 });
    await db.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
    
    return db;
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err.message);
    throw err;
  }
}

function getDB() {
  if (!db) throw new Error('Database not connected');
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

module.exports = { connectDB, getDB, closeDB };
