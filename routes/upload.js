const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const { getDB } = require('../db');
const router = express.Router();

const HF_SPACE_URL = process.env.HF_SPACE_URL || 'https://gamehub-storage.hf.space/api/predict';
const HF_TOKEN = process.env.HF_TOKEN;

// AVATAR UPLOAD
router.post('/avatar', async (req, res) => {
    try {
        if (!req.files || !req.files.avatar) {
            return res.status(400).json({ error: 'Dosya gerekli' });
        }
        
        const file = req.files.avatar;
        const userId = req.user?._id || req.body.userId;
        const username = req.user?.username || req.body.username;
        
        if (!username) {
            return res.status(400).json({ error: 'Kullanıcı adı gerekli' });
        }
        
        const form = new FormData();
        form.append('file', file.data, {
            filename: file.name,
            contentType: file.mimetype
        });
        form.append('username', username);
        
        const response = await axios.post(`${HF_SPACE_URL}/upload_avatar`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${HF_TOKEN}`
            },
            timeout: 30000
        });
        
        const avatarUrl = response.data;
        
        if (avatarUrl.startsWith('Hata:')) {
            return res.status(500).json({ error: avatarUrl });
        }
        
        const db = getDB();
        await db.collection('users').updateOne(
            { _id: userId },
            { $set: { avatar: avatarUrl, updatedAt: new Date() } }
        );
        
        res.json({ success: true, avatar: avatarUrl });
        
    } catch (err) {
        console.error('Avatar upload error:', err.message);
        res.status(500).json({ error: 'Avatar yüklenemedi: ' + err.message });
    }
});

// GENEL DOSYA UPLOAD
router.post('/file', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'Dosya gerekli' });
        }
        
        const file = req.files.file;
        const folder = req.body.folder || 'uploads';
        const filename = req.body.filename || file.name;
        
        const form = new FormData();
        form.append('file', file.data, {
            filename: file.name,
            contentType: file.mimetype
        });
        form.append('folder', folder);
        form.append('filename', filename);
        
        const response = await axios.post(HF_SPACE_URL, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${HF_TOKEN}`
            },
            timeout: 30000
        });
        
        const fileUrl = response.data;
        
        if (fileUrl.startsWith('Hata:')) {
            return res.status(500).json({ error: fileUrl });
        }
        
        res.json({ success: true, url: fileUrl, folder, filename });
        
    } catch (err) {
        console.error('File upload error:', err.message);
        res.status(500).json({ error: 'Dosya yüklenemedi: ' + err.message });
    }
});

// OYUN GÖRSELİ UPLOAD
router.post('/game-image', async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'Görsel gerekli' });
        }
        
        const file = req.files.image;
        const gameId = req.body.gameId;
        const userId = req.user?._id || req.body.userId;
        
        if (!gameId || !userId) {
            return res.status(400).json({ error: 'gameId ve userId gerekli' });
        }
        
        const form = new FormData();
        form.append('file', file.data, {
            filename: file.name,
            contentType: file.mimetype
        });
        form.append('game_id', gameId);
        form.append('user_id', userId);
        
        const response = await axios.post(`${HF_SPACE_URL}/upload_game_image`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${HF_TOKEN}`
            },
            timeout: 30000
        });
        
        const imageUrl = response.data;
        
        const db = getDB();
        await db.collection('game_images').insertOne({
            userId,
            gameId,
            url: imageUrl,
            createdAt: new Date()
        });
        
        res.json({ success: true, url: imageUrl });
        
    } catch (err) {
        console.error('Game image upload error:', err.message);
        res.status(500).json({ error: 'Görsel yüklenemedi: ' + err.message });
    }
});

module.exports = router;
          
