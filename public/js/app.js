// ===== GLOBAL STATE =====
const state = {
  user: null,
  token: localStorage.getItem('gamehub_token'),
  socket: null,
  currentGame: null,
  gameInstance: null,
  isGuest: false
};

// ===== SOCKET.IO =====
function initSocket() {
  state.socket = io();
  state.socket.on('connect', () => {
    if (state.user) {
      state.socket.emit('join', { username: state.user.username, userId: state.user._id });
    }
  });
}

// ===== AUTH FUNCTIONS =====
function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(tab + 'Tab').classList.add('active');
}

// ===== AVATAR SEÇİM =====
let selectedAvatarStyle = 0;

function showAvatarPicker() {
  if (!state.user) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'avatarModal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px;">
      <h2 style="font-family:Orbitron;text-align:center;margin-bottom:20px;">
        <i class="fas fa-user-circle"></i> Avatar Seç
      </h2>
      <div id="avatarGrid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:15px;margin-bottom:20px;"></div>
      <button onclick="closeAvatarModal()" class="btn-primary">Kapat</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  loadAvatars();
}

async function loadAvatars() {
  try {
    const res = await fetch('/api/auth/avatars');
    const avatars = await res.json();
    
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = avatars.map(a => `
      <div onclick="selectAvatar(${a.style})" style="
        cursor:pointer;border-radius:15px;padding:10px;
        border:3px solid ${a.style === (state.user?.avatarStyle || 0) ? '#00d4ff' : 'transparent'};
        background:rgba(255,255,255,0.05);transition:all 0.3s;
        text-align:center;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <img src="${a.preview}" style="width:60px;height:60px;border-radius:50%;">
        <p style="font-size:0.75rem;color:#aaa;margin-top:5px;">${a.name}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Avatar load error:', err);
  }
}

async function selectAvatar(style) {
  if (!state.token) return;
  
  try {
    const res = await fetch('/api/auth/avatar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.token
      },
      body: JSON.stringify({ avatarStyle: style })
    });
    
    const data = await res.json();
    if (data.success) {
      state.user.avatar = data.avatar;
      state.user.avatarStyle = data.avatarStyle;
      document.getElementById('userAvatar').src = data.avatar;
      closeAvatarModal();
    }
  } catch (err) {
    console.error('Avatar select error:', err);
  }
}

function closeAvatarModal() {
  const modal = document.getElementById('avatarModal');
  if (modal) modal.remove();
}

// ===== KAYIT - Avatar seçimli =====
async function register() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  
  if (!username || !email || !password) return alert('Tüm alanları doldurun');
  if (password.length < 6) return alert('Şifre en az 6 karakter olmalı');
  
  showRegisterAvatarPicker(username, email, password);
}

function showRegisterAvatarPicker(username, email, password) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'regAvatarModal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px;">
      <h2 style="font-family:Orbitron;text-align:center;margin-bottom:20px;">
        <i class="fas fa-user-circle"></i> Avatar Seç
      </h2>
      <div id="regAvatarGrid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:15px;margin-bottom:20px;"></div>
      <button onclick="completeRegister('${username}', '${email}', '${password}')" class="btn-primary">Kayıt Ol</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  fetch('/api/auth/avatars')
    .then(r => r.json())
    .then(avatars => {
      const grid = document.getElementById('regAvatarGrid');
      grid.innerHTML = avatars.map(a => `
        <div onclick="window.selectedRegAvatar=${a.style};document.querySelectorAll('#regAvatarGrid > div').forEach(d=>d.style.border='3px solid transparent');this.style.border='3px solid #00d4ff'" style="
          cursor:pointer;border-radius:15px;padding:10px;
          border:3px solid ${a.style === 0 ? '#00d4ff' : 'transparent'};
          background:rgba(255,255,255,0.05);transition:all 0.3s;
          text-align:center;
        ">
          <img src="${a.preview}" style="width:60px;height:60px;border-radius:50%;">
          <p style="font-size:0.75rem;color:#aaa;margin-top:5px;">${a.name}</p>
        </div>
      `).join('');
    });
  
  window.selectedRegAvatar = 0;
}

async function completeRegister(username, email, password) {
  const avatarStyle = window.selectedRegAvatar || 0;
  
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, avatarStyle })
    });
    
    const data = await res.json();
    if (data.token) {
      state.token = data.token;
      state.user = data.user;
      state.isGuest = false;
      localStorage.setItem('gamehub_token', data.token);
      document.getElementById('regAvatarModal').remove();
      initSocket();
      showMainApp();
    } else {
      alert(data.error || 'Kayıt başarısız');
    }
  } catch (err) {
    alert('Sunucu hatası: ' + err.message);
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) return alert('Email ve şifre girin');
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      state.token = data.token;
      state.user = data.user;
      state.isGuest = false;
      localStorage.setItem('gamehub_token', data.token);
      initSocket();
      showMainApp();
    } else {
      alert(data.error || 'Giriş başarısız');
    }
  } catch (err) {
    alert('Sunucu hatası: ' + err.message);
  }
}

function playAsGuest() {
  state.user = {
    _id: 'guest_' + Date.now(),
    username: 'Misafir_' + Math.floor(Math.random() * 9999),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
    coins: 1000, level: 1, xp: 0, gamesPlayed: 0, wins: 0
  };
  state.isGuest = true;
  state.token = null;
  initSocket();
  showMainApp();
}

async function loadProfile() {
  if (!state.token || state.isGuest) return;
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { 'Authorization': 'Bearer ' + state.token }
    });
    if (res.ok) {
      state.user = await res.json();
      updateUserBar();
    }
  } catch (err) { console.error('Profile load error:', err); }
}

function updateUserBar() {
  if (!state.user) return;
  document.getElementById('userName').textContent = state.user.username;
  document.getElementById('userCoins').textContent = state.user.coins;
  document.getElementById('userLevel').textContent = state.user.level;
  document.getElementById('userAvatar').src = state.user.avatar;
}

function showMainApp() {
  document.getElementById('authModal').classList.remove('active');
  document.getElementById('mainApp').classList.remove('hidden');
  updateUserBar();
  renderGames();
}

function logout() {
  state.user = null; state.token = null; state.isGuest = false;
  localStorage.removeItem('gamehub_token');
  if (state.socket) state.socket.disconnect();
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('authModal').classList.add('active');
}

// ===== GAMES DATA =====
const games = [
  { id: 'snake', name: 'Yılan Oyunu', desc: 'Klasik yılan oyunu, yemleri yiyerek büyü', category: 'classic', icon: 'fa-worm', color: '#4ade80', players: '1 Oyuncu' },
  { id: 'tetris', name: 'Tetris', desc: 'Blokları sırala, satırları temizle', category: 'puzzle', icon: 'fa-th', color: '#a855f7', players: '1 Oyuncu' },
  { id: 'pong', name: 'Pong', desc: 'Klasik masa tenisi oyunu', category: 'classic', icon: 'fa-table-tennis', color: '#f97316', players: '1-2 Oyuncu' },
  { id: 'breakout', name: 'Breakout', desc: 'Tuğlaları kır, topu tut', category: 'classic', icon: 'fa-border-all', color: '#ec4899', players: '1 Oyuncu' },
  { id: 'memory', name: 'Hafıza Oyunu', desc: 'Eşleşen kartları bul', category: 'puzzle', icon: 'fa-brain', color: '#06b6d4', players: '1 Oyuncu' },
  { id: 'minesweeper', name: 'Mayın Tarlası', desc: 'Mayınlara basmadan tüm alanı aç', category: 'puzzle', icon: 'fa-bomb', color: '#ef4444', players: '1 Oyuncu' },
  { id: 'flappy', name: 'Flappy Bird', desc: 'Engellerin arasından uç', category: 'action', icon: 'fa-crow', color: '#fbbf24', players: '1 Oyuncu' },
  { id: 'dino', name: 'Dino Run', desc: 'Engelleri atla, koşmaya devam et', category: 'action', icon: 'fa-horse', color: '#22c55e', players: '1 Oyuncu' },
  { id: '2048', name: '2048', desc: 'Sayıları birleştir, 2048e ulaş', category: 'puzzle', icon: 'fa-calculator', color: '#f59e0b', players: '1 Oyuncu' },
  { id: 'tictactoe', name: 'XOX', desc: '3lü yap, kazan', category: 'classic', icon: 'fa-times', color: '#3b82f6', players: '2 Oyuncu' },
  { id: 'connect4', name: 'Dörtlü', desc: '4lü yatay/dikey/çapraz yap', category: 'strategy', icon: 'fa-circle', color: '#dc2626', players: '2 Oyuncu' },
  { id: 'chess', name: 'Satranç', desc: 'Stratejik satranç oyunu', category: 'strategy', icon: 'fa-chess-king', color: '#8b5cf6', players: '2 Oyuncu' },
  { id: 'spaceinvaders', name: 'Uzay İstilacıları', desc: 'Uzaylıları yok et', category: 'action', icon: 'fa-rocket', color: '#10b981', players: '1 Oyuncu' },
  { id: 'asteroids', name: 'Asteroidler', desc: 'Asteroidleri vur, hayatta kal', category: 'action', icon: 'fa-star', color: '#6366f1', players: '1 Oyuncu' },
  { id: 'pacman', name: 'Pac-Man', desc: 'Noktaları ye, hayaletlerden kaç', category: 'classic', icon: 'fa-skull', color: '#eab308', players: '1 Oyuncu' },
  { id: 'wordle', name: 'Kelime Tahmini', desc: '5 harfli kelimeyi bul', category: 'puzzle', icon: 'fa-font', color: '#14b8a6', players: '1 Oyuncu' },
  { id: 'hangman', name: 'Adam Asmaca', desc: 'Kelimeyi tahmin et', category: 'puzzle', icon: 'fa-user', color: '#f43f5e', players: '1-2 Oyuncu' },
  { id: 'sudoku', name: 'Sudoku', desc: 'Sayıları doğru yerleştir', category: 'puzzle', icon: 'fa-border-all', color: '#0ea5e9', players: '1 Oyuncu' },
  { id: 'checkers', name: 'Dama', desc: 'Klasik dama oyunu', category: 'strategy', icon: 'fa-chess', color: '#b45309', players: '2 Oyuncu' },
  { id: 'whackamole', name: 'Köstebek Vurma', desc: 'Köstebekleri vur, puan topla', category: 'action', icon: 'fa-gavel', color: '#84cc16', players: '1 Oyuncu' }
];

function renderGames(filter = 'all') {
  const grid = document.getElementById('gamesGrid');
  const filtered = filter === 'all' ? games : games.filter(g => g.category === filter);
  
  grid.innerHTML = filtered.map(game => `
    <div class="game-card" onclick="openGame('${game.id}')">
      <div class="game-icon" style="background: linear-gradient(135deg, ${game.color}33, ${game.color}11)">
        <i class="fas ${game.icon}" style="color: ${game.color}"></i>
      </div>
      <div class="game-info">
        <h3>${game.name}</h3>
        <p>${game.desc}</p>
        <div class="game-meta">
          <span class="tag ${game.category}">${game.category.toUpperCase()}</span>
          <span class="players"><i class="fas fa-users"></i> ${game.players}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function filterGames(category) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderGames(category);
}

// ===== GAME LOADER =====
function openGame(gameId) {
  const game = games.find(g => g.id === gameId);
  if (!game) return;
  
  state.currentGame = gameId;
  document.getElementById('gameTitle').textContent = game.name;
  document.getElementById('gameModal').classList.add('active');
  
  const container = document.getElementById('gameContainer');
  container.innerHTML = '';
  
  const script = document.createElement('script');
  script.src = `/games/${gameId}.js`;
  script.onload = () => {
    const fnName = 'init' + gameId.charAt(0).toUpperCase() + gameId.slice(1);
    if (window[fnName]) {
      state.gameInstance = window[fnName](container);
    }
  };
  document.head.appendChild(script);
}

function closeGame() {
  if (state.gameInstance && state.gameInstance.destroy) {
    state.gameInstance.destroy();
  }
  state.gameInstance = null;
  state.currentGame = null;
  document.getElementById('gameModal').classList.remove('active');
  document.getElementById('gameContainer').innerHTML = '';
}

function restartGame() {
  if (state.currentGame) {
    closeGame();
    setTimeout(() => openGame(state.currentGame), 100);
  }
}

// ===== LEADERBOARD =====
async function showLeaderboard() {
  if (!state.currentGame) return;
  try {
    const res = await fetch(`/api/games/leaderboard/${state.currentGame}?limit=10`);
    const scores = await res.json();
    const list = document.getElementById('leaderboardList');
    
    list.innerHTML = scores.length === 0 
      ? '<p class="text-center" style="color:#888;padding:20px;">Henüz skor yok</p>'
      : scores.map((s, i) => `
        <div class="leaderboard-item">
          <span class="rank ${i < 3 ? ['gold','silver','bronze'][i] : ''}">${i + 1}</span>
          <span class="lb-name">${s.username}</span>
          <span class="lb-score">${s.score.toLocaleString()}</span>
        </div>
      `).join('');
    
    document.getElementById('leaderboardModal').classList.add('active');
  } catch (err) {
    console.error('Leaderboard error:', err);
  }
}

function closeLeaderboard() {
  document.getElementById('leaderboardModal').classList.remove('active');
}

// ===== SAVE SCORE =====
async function saveScore(gameId, score) {
  if (state.isGuest || !state.user) return;
  try {
    await fetch('/api/games/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.token
      },
      body: JSON.stringify({ userId: state.user._id, gameId, score, username: state.user.username })
    });
  } catch (err) { console.error('Save score error:', err); }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (state.token) {
    loadProfile().then(() => {
      if (state.user) showMainApp();
      else logout();
    });
  }
});
