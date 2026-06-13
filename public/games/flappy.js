function initFlappy(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 400; canvas.height = 500;
  
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="flappyScore">0</span></div>
    <div class="lives">En İyi: <span id="flappyBest">0</span></div>
    <div class="timer">Tıkla/Uç</div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let bird = { x: 80, y: 200, vy: 0, radius: 15 };
  let pipes = [], score = 0, best = parseInt(localStorage.getItem('flappy_best') || '0');
  let gameLoop = null, isGameOver = false, isStarted = false;
  const GRAVITY = 0.5, JUMP = -8, PIPE_W = 60, PIPE_GAP = 140, PIPE_SPEED = 2;
  
  document.getElementById('flappyBest').textContent = best;
  
  function spawnPipe() {
    const minHeight = 50, maxHeight = canvas.height - PIPE_GAP - minHeight - 100;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight);
    pipes.push({ x: canvas.width, topHeight, passed: false });
  }
  
  function draw() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(100, 80, 30, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(130, 80, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(300, 120, 35, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 5);
    
    pipes.forEach(p => {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(p.x, 0, PIPE_W, p.topHeight);
      ctx.fillRect(p.x, p.topHeight + PIPE_GAP, PIPE_W, canvas.height - p.topHeight - PIPE_GAP - 40);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(p.x - 3, p.topHeight - 20, PIPE_W + 6, 20);
      ctx.fillRect(p.x - 3, p.topHeight + PIPE_GAP, PIPE_W + 6, 20);
    });
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(bird.x - 5, bird.y - 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(bird.x + 6, bird.y - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(bird.x + 7, bird.y - 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.fillRect(bird.x + 8, bird.y + 2, 10, 4);
  }
  
  function update() {
    if (!isStarted || isGameOver) return;
    
    bird.vy += GRAVITY;
    bird.y += bird.vy;
    
    if (bird.y + bird.radius > canvas.height - 40 || bird.y - bird.radius < 0) {
      gameOver(); return;
    }
    
    pipes.forEach(p => {
      if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + PIPE_W) {
        if (bird.y - bird.radius < p.topHeight || bird.y + bird.radius > p.topHeight + PIPE_GAP) {
          gameOver();
        }
      }
      if (!p.passed && p.x + PIPE_W < bird.x) {
        p.passed = true;
        score++;
        document.getElementById('flappyScore').textContent = score;
      }
      p.x -= PIPE_SPEED;
    });
    
    pipes = pipes.filter(p => p.x + PIPE_W > 0);
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
      spawnPipe();
    }
    
    draw();
  }
  
  function jump() {
    if (isGameOver) { reset(); return; }
    if (!isStarted) { isStarted = true; spawnPipe(); }
    bird.vy = JUMP;
  }
  
  function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    if (score > best) {
      best = score;
      localStorage.setItem('flappy_best', best);
      document.getElementById('flappyBest').textContent = best;
    }
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 35px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 30);
    ctx.fillStyle = '#fff'; ctx.font = '22px Inter';
    ctx.fillText(`Skor: ${score}`, canvas.width/2, canvas.height/2 + 10);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Tıkla Yeniden Başla', canvas.width/2, canvas.height/2 + 50);
    
    if (typeof saveScore === 'function') saveScore('flappy', score * 100);
  }
  
  function reset() {
    bird = { x: 80, y: 200, vy: 0, radius: 15 };
    pipes = []; score = 0; isGameOver = false; isStarted = false;
    document.getElementById('flappyScore').textContent = '0';
    draw();
    gameLoop = setInterval(update, 1000/60);
  }
  
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
  document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  
  draw();
  gameLoop = setInterval(update, 1000/60);
  
  return { destroy() { clearInterval(gameLoop); } };
}
