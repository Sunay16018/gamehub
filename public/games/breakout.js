function initBreakout(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 600; canvas.height = 450;
  
  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="breakoutScore">0</span></div>
    <div class="lives"><i class="fas fa-heart"></i> <span id="breakoutLives">3</span></div>
    <div class="timer">Tuğla: <span id="breakoutBricks">0</span></div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const PADDLE_W = 80, PADDLE_H = 12, BALL_R = 6;
  const BRICK_ROWS = 5, BRICK_COLS = 10, BRICK_W = 50, BRICK_H = 20, BRICK_PAD = 5, BRICK_TOP = 50;
  const COLORS = ['#ff6b6b','#fbbf24','#22c55e','#3b82f6','#a855f7'];
  
  let paddleX = 260, ball = { x: 300, y: 350, dx: 3, dy: -3 };
  let bricks = [], score = 0, lives = 3;
  let gameLoop = null, isGameOver = false, isPaused = false;
  
  function initBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: c * (BRICK_W + BRICK_PAD) + 25,
          y: r * (BRICK_H + BRICK_PAD) + BRICK_TOP,
          color: COLORS[r],
          active: true
        });
      }
    }
    document.getElementById('breakoutBricks').textContent = bricks.length;
  }
  
  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    bricks.forEach(b => {
      if (!b.active) return;
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color; ctx.shadowBlur = 5;
      ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
      ctx.shadowBlur = 0;
    });
    
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10;
    ctx.fillRect(paddleX, canvas.height - 30, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  function update() {
    if (isPaused || isGameOver) return;
    
    ball.x += ball.dx; ball.y += ball.dy;
    
    if (ball.x - BALL_R < 0 || ball.x + BALL_R > canvas.width) ball.dx *= -1;
    if (ball.y - BALL_R < 0) ball.dy *= -1;
    
    if (ball.y + BALL_R > canvas.height) {
      lives--;
      document.getElementById('breakoutLives').textContent = lives;
      if (lives <= 0) { gameOver(); return; }
      ball = { x: 300, y: 350, dx: 3, dy: -3 };
    }
    
    if (ball.y + BALL_R > canvas.height - 30 && ball.y - BALL_R < canvas.height - 30 + PADDLE_H &&
        ball.x > paddleX && ball.x < paddleX + PADDLE_W) {
      ball.dy = -Math.abs(ball.dy);
      ball.dx += (ball.x - (paddleX + PADDLE_W/2)) * 0.05;
    }
    
    bricks.forEach(b => {
      if (!b.active) return;
      if (ball.x > b.x && ball.x < b.x + BRICK_W && ball.y > b.y && ball.y < b.y + BRICK_H) {
        b.active = false;
        ball.dy *= -1;
        score += 10;
        document.getElementById('breakoutScore').textContent = score;
        document.getElementById('breakoutBricks').textContent = bricks.filter(b => b.active).length;
        
        if (bricks.every(b => !b.active)) {
          initBricks();
          ball.dx *= 1.2; ball.dy *= 1.2;
        }
      }
    });
    
    draw();
  }
  
  function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 40px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '24px Inter';
    ctx.fillText(`Skor: ${score}`, canvas.width/2, canvas.height/2 + 30);
    if (typeof saveScore === 'function') saveScore('breakout', score);
  }
  
  function handleKey(e) {
    if (isGameOver) return;
    switch(e.key) {
      case 'ArrowLeft': paddleX = Math.max(0, paddleX - 40); break;
      case 'ArrowRight': paddleX = Math.min(canvas.width - PADDLE_W, paddleX + 40); break;
      case ' ': isPaused = !isPaused; break;
    }
  }
  
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    paddleX = e.clientX - rect.left - PADDLE_W/2;
    paddleX = Math.max(0, Math.min(canvas.width - PADDLE_W, paddleX));
  });
  
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    paddleX = e.touches[0].clientX - rect.left - PADDLE_W/2;
    paddleX = Math.max(0, Math.min(canvas.width - PADDLE_W, paddleX));
  });
  
  document.addEventListener('keydown', handleKey);
  initBricks(); draw();
  gameLoop = setInterval(update, 1000/60);
  
  return { destroy() { clearInterval(gameLoop); document.removeEventListener('keydown', handleKey); } };
}
