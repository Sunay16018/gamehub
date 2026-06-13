const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli' });
    }
    const db = getDB();
    const existing = await db.collection('users').findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'Email veya kullanıcı adı zaten kullanımda' });
    
    const hashed = await bcrypt.hash(password, 12);
    const user = {
      username, email, password: hashed,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      coins: 1000, level: 1, xp: 0, gamesPlayed: 0, wins: 0,
      createdAt: new Date(), lastLogin: new Date()
    };
    const result = await db.collection('users').insertOne(user);
    const token = generateToken(result.insertedId);
    res.status(201).json({ token, user: { _id: result.insertedId, username, email, coins: 1000, level: 1 } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Kayıt başarısız' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email ve şifre gerekli' });
    const db = getDB();
    const user = await db.collection('users').findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }
    await db.collection('users').updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
    const token = generateToken(user._id);
    res.json({ token, user: { _id: user._id, username: user.username, email: user.email, coins: user.coins, level: user.level, xp: user.xp, gamesPlayed: user.gamesPlayed, wins: user.wins, avatar: user.avatar } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Giriş başarısız' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token gerekli' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: decoded.userId });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json({ _id: user._id, username: user.username, email: user.email, coins: user.coins, level: user.level, xp: user.xp, gamesPlayed: user.gamesPlayed, wins: user.wins, avatar: user.avatar });
  } catch (err) {
    res.status(401).json({ error: 'Geçersiz token' });
  }
});

module.exports = router;
