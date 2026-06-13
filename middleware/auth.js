const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'GameHubSuperSecretKey2026!@#$%';

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token gerekli' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: decoded.userId });

    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
}

module.exports = { authenticate, generateToken };