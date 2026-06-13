# GameHub - 20 Online Oyun Platformu

MongoDB Atlas ile çalışan, 20 farklı oyun içeren tam donanımlı oyun platformu.

## Özellikler

- **20 Oyun**: Snake, Tetris, Pong, Breakout, Memory, Minesweeper, Flappy Bird, Dino Run, 2048, TicTacToe, Connect4, Chess, Space Invaders, Asteroids, Pac-Man, Wordle, Hangman, Sudoku, Checkers, Whack-a-Mole
- **MongoDB Atlas**: Kullanıcı kaydı, giriş, skor kaydetme, lider tablosu
- **JWT Authentication**: Güvenli token bazlı kimlik doğrulama
- **Socket.IO**: Çok oyunculu oda sistemi
- **Responsive**: Mobil ve masaüstü uyumlu
- **Touch Desteği**: Tüm oyunlarda dokunmatik ekran desteği

## Kurulum

```bash
npm install
npm start
```

## Ortam Değişkenleri

`.env` dosyası:
```
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

## Kullanım

1. Kayıt ol veya misafir olarak oyna
2. Oyun seç ve başla
3. Skorlar otomatik MongoDB'ye kaydedilir
4. Lider tablosunu görüntüle

## Teknolojiler

- Node.js + Express
- MongoDB Atlas (MongoDB Driver v6)
- Socket.IO
- JWT + bcryptjs
- Vanilla JavaScript (Canvas API)
