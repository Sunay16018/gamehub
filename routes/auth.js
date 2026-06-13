const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// AVATAR LİSTESİ
const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=',
  'https://api.dicebear.com/7.x/bottts/svg?seed=',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=',
  'https://api.dicebear.com/7.x/notionists/svg?seed=',
  'https://api.dicebear.com/7.x/open-peeps/svg?seed=',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=',
  'https://api.dicebear.com/7.x/identicon/svg?seed='
];

function getAvatarUrl(styleIndex, username) {
  const index = Math.min(Math.max(0, styleIndex || 0), AVATARS.length - 1);
  return AVATARS[index] + username;
}

// KAYIT - Avatar seçimli
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatarStyle } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli' });
    }
    
    const db = getDB();
    const existing = await db.collection('users').findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'Email veya kullanıcı adı zaten kullanımda' });
    
    const avatar = getAvatarUrl(avatarStyle, username);
    const hashed = await bcrypt.hash(password, 12);
    
    const user = {
      username, email, password: hashed, avatar,
      avatarStyle: avatarStyle || 0,
      coins: 1000, level: 1, xp: 0, gamesPlayed: 0, wins: 0,
      createdAt: new Date(), lastLogin: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    const token = generateToken(result.insertedId);
    
    res.status(201).json({ 
      token, 
      user: { 
        _id: result.insertedId, 
        username, 
        email, 
        avatar,
        avatarStyle: user.avatarStyle,
        coins: 1000, 
        level: 1 
      } 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Kayıt başarısız' });
  }
});

// GİRİŞ
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email ve şifre gerekli' });
    
    const db = getDB();
    const user = await db.collection('users').findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Geçersiz email veya şifre' });
    }
    
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    
    const token = generateToken(user._id);
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        username: user.username, 
        email: user.email,
        avatar: user.avatar,
        avatarStyle: user.avatarStyle || 0,
        coins: user.coins,
        level: user.level,
        xp: user.xp,
        gamesPlayed: user.gamesPlayed,
        wins: user.wins
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Giriş başarısız' });
  }
});

// PROFİL
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token gerekli' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: decoded.userId });
    
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarStyle: user.avatarStyle || 0,
      coins: user.coins,
      level: user.level,
      xp: user.xp,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins
    });
  } catch (err) {
    res.status(401).json({ error: 'Geçersiz token' });
  }
});

// AVATAR DEĞİŞTİR (Profil ikonuna tıklayınca)
router.put('/avatar', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token gerekli' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const { avatarStyle } = req.body;
    
    if (avatarStyle === undefined || avatarStyle < 0 || avatarStyle >= AVATARS.length) {
      return res.status(400).json({ error: 'Geçersiz avatar stili' });
    }
    
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: decoded.userId });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    
    const newAvatar = getAvatarUrl(avatarStyle, user.username);
    
    await db.collection('users').updateOne(
      { _id: decoded.userId },
      { $set: { avatar: newAvatar, avatarStyle: avatarStyle } }
    );
    
    res.json({ success: true, avatar: newAvatar, avatarStyle });
  } catch (err) {
    console.error('Avatar update error:', err);
    res.status(500).json({ error: 'Avatar güncellenemedi' });
  }
});

// AVATAR LİSTESİNİ GETİR
router.get('/avatars', async (req, res) => {
  const avatars = AVATARS.map((url, i) => ({
    style: i,
    preview: url + 'demo' + i,
    name: ['Avatar', 'Robot', 'Emoji', 'Macera', 'Lorelei', 'Notion', 'Peep', 'Pixel', 'Thumb', 'Identicon'][i]
  }));
  res.json(avatars);
});

module.exports = router;
        
