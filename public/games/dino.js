function initDino(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 700; canvas.height = 250;
  
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="dinoScore">0</span></div>
    <div class="lives">Hız: <span id="dinoSpeed">1</span></div>
    <div class="timer">Boşluk/Ekrana Dokun</div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let dino = { x: 50, y: 180, vy: 0, width: 40, height: 50, grounded: true };
  let obstacles = [], clouds = [], score = 0, speed = 5, gameLoop = null;
  let isGameOver = false, isStarted = false;
  const GRAVITY = 0.6, JUMP = -12, GROUND_Y = 200;
  
  function spawnObstacle() {
    const types = ['cactus', 'cactus2', 'bird'];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({ x: canvas.width, type, width: type === 'bird' ? 40 : 30, height: type === 'bird' ? 30 : 50 });
  }
  
  function spawnCloud() {
    clouds.push({ x: canvas.width, y: Math.random() * 80 + 20, width: 60 + Math.random() * 40 });
  }
  
  function draw() {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, GROUND_Y + dino.height, canvas.width, canvas.height - GROUND_Y - dino.height);
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(0, GROUND_Y + dino.height, canvas.width, 3);
    
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    clouds.forEach(c => {
      ctx.beginPath(); ctx.ellipse(c.x, c.y, c.width/2, 20, 0, 0, Math.PI * 2); ctx.fill();
    });
    
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(dino.x + 25, dino.y + 8, 8, 8);
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(dino.x + 28, dino.y + 10, 3, 3);
    
    obstacles.forEach(o => {
      if (o.type === 'cactus' || o.type === 'cactus2') {
        ctx.fillStyle = '#228b22';
        ctx.fillRect(o.x, GROUND_Y + dino.height - o.height, o.width, o.height);
      } else {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + 20, o.y - 10); ctx.lineTo(o.x + 40, o.y); ctx.fill();
      }
    });
  }
  
  function update() {
    if (!isStarted || isGameOver) return;
    
    dino.vy += GRAVITY;
    dino.y += dino.vy;
    if (dino.y >= GROUND_Y) {
      dino.y = GROUND_Y;
      dino.vy = 0;
      dino.grounded = true;
    }
    
    obstacles.forEach(o => {
      o.x -= speed;
      if (dino.x < o.x + o.width && dino.x + dino.width > o.x &&
          dino.y < (o.type === 'bird' ? o.y + 30 : GROUND_Y + dino.height) &&
          dino.y + dino.height > (o.type === 'bird' ? o.y : GROUND_Y + dino.height - o.height)) {
        gameOver();
      }
    });
    
    obstacles = obstacles.filter(o => o.x + o.width > 0);
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300 - Math.random() * 200) {
      spawnObstacle();
    }
    
    clouds.forEach(c => c.x -= 1);
    clouds = clouds.filter(c => c.x + c.width > 0);
    if (Math.random() < 0.01) spawnCloud();
    
    score++;
    if (score % 500 === 0) {
      speed += 0.5;
      document.getElementById('dinoSpeed').textContent = Math.floor(speed);
    }
    document.getElementById('dinoScore').textContent = Math.floor(score / 10);
    
    draw();
  }
  
  function jump() {
    if (isGameOver) { reset(); return; }
    if (!isStarted) { isStarted = true; }
    if (dino.grounded) {
      dino.vy = JUMP;
      dino.grounded = false;
    }
  }
  
  function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 35px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '22px Inter';
    ctx.fillText(`Skor: ${Math.floor(score / 10)}`, canvas.width/2, canvas.height/2 + 20);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Boşluk/Tıkla Yeniden', canvas.width/2, canvas.height/2 + 55);
    
    if (typeof saveScore === 'function') saveScore('dino', Math.floor(score / 10));
  }
  
  function reset() {
    dino = { x: 50, y: 180, vy: 0, width: 40, height: 50, grounded: true };
    obstacles = []; clouds = []; score = 0; speed = 5; isGameOver = false; isStarted = false;
    document.getElementById('dinoScore').textContent = '0';
    document.getElementById('dinoSpeed').textContent = '1';
    draw();
    gameLoop = setInterval(update, 1000/60);
  }
  
  document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); jump(); } });
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
  
  for (let i = 0; i < 3; i++) spawnCloud();
  draw();
  gameLoop = setInterval(update, 1000/60);
  
  return { destroy() { clearInterval(gameLoop); } };
}
