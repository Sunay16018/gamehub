const express = require('express');
const { getDB } = require('../db');
const router = express.Router();

router.post('/score', async (req, res) => {
  try {
    const { userId, gameId, score, username } = req.body;
    if (!userId || !gameId || score === undefined) return res.status(400).json({ error: 'Gerekli alanlar eksik' });
    const db = getDB();
    const existing = await db.collection('scores').findOne({ userId, gameId });
    if (!existing || score > existing.score) {
      await db.collection('scores').updateOne(
        { userId, gameId },
        { $set: { score, username, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    }
    await db.collection('users').updateOne(
      { _id: userId },
      { $inc: { gamesPlayed: 1, xp: Math.floor(score / 10) }, $set: { lastLogin: new Date() } }
    );
    res.json({ success: true, newHighScore: !existing || score > existing.score });
  } catch (err) {
    console.error('Score save error:', err);
    res.status(500).json({ error: 'Skor kaydedilemedi' });
  }
});

router.get('/leaderboard/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { limit = 50 } = req.query;
    const db = getDB();
    const scores = await db.collection('scores').find({ gameId }).sort({ score: -1 }).limit(parseInt(limit)).toArray();
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Lider tablosu alınamadı' });
  }
});

router.get('/scores/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDB();
    const scores = await db.collection('scores').find({ userId }).sort({ updatedAt: -1 }).toArray();
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Skorlar alınamadı' });
  }
});

module.exports = router;