function initPong(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 700; canvas.height = 400;

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Oyuncu: <span id="pongPlayer">0</span></div>
    <div class="timer">Bot: <span id="pongBot">0</span></div>
    <div class="lives"><i class="fas fa-trophy"></i> <span id="pongRound">1</span></div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const PADDLE_W = 12, PADDLE_H = 80, BALL_R = 8;

  let playerY = 160, botY = 160;
  let ball = { x: 350, y: 200, dx: 4, dy: 3 };
  let playerScore = 0, botScore = 0, round = 1;
  let gameLoop = null, isGameOver = false, isPaused = false;

  function resetBall() {
    ball = { x: 350, y: 200, dx: (Math.random() > 0.5 ? 1 : -1) * (3 + round), dy: (Math.random() - 0.5) * 4 };
  }

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.strokeStyle = 'rgba(0,212,255,0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10;
    ctx.fillRect(10, playerY, PADDLE_W, PADDLE_H);
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b'; ctx.shadowBlur = 10;
    ctx.fillRect(canvas.width - 10 - PADDLE_W, botY, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function update() {
    if (isPaused || isGameOver) return;

    ball.x += ball.dx; ball.y += ball.dy;

    // Wall bounce
    if (ball.y - BALL_R < 0 || ball.y + BALL_R > canvas.height) ball.dy *= -1;

    // Player paddle
    if (ball.x - BALL_R < 10 + PADDLE_W && ball.y > playerY && ball.y < playerY + PADDLE_H) {
      ball.dx = Math.abs(ball.dx) * 1.05;
      ball.dy += (ball.y - (playerY + PADDLE_H/2)) * 0.1;
    }
    // Bot paddle
    if (ball.x + BALL_R > canvas.width - 10 - PADDLE_W && ball.y > botY && ball.y < botY + PADDLE_H) {
      ball.dx = -Math.abs(ball.dx) * 1.05;
      ball.dy += (ball.y - (botY + PADDLE_H/2)) * 0.1;
    }

    // Score
    if (ball.x < 0) { botScore++; document.getElementById('pongBot').textContent = botScore; resetBall(); }
    if (ball.x > canvas.width) { playerScore++; document.getElementById('pongPlayer').textContent = playerScore; resetBall(); }

    // Bot AI
    const target = ball.y - PADDLE_H/2;
    botY += (target - botY) * 0.08;
    botY = Math.max(0, Math.min(canvas.height - PADDLE_H, botY));

    // Game over
    if (playerScore >= 10 || botScore >= 10) {
      isGameOver = true;
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = playerScore >= 10 ? '#00d4ff' : '#ff6b6b';
      ctx.font = 'bold 35px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(playerScore >= 10 ? 'KAZANDIN!' : 'KAYBETTİN', canvas.width/2, canvas.height/2);
      if (typeof saveScore === 'function') saveScore('pong', playerScore * 100);
    }

    draw();
  }

  function handleKey(e) {
    if (isGameOver) return;
    switch(e.key) {
      case 'ArrowUp': playerY = Math.max(0, playerY - 30); break;
      case 'ArrowDown': playerY = Math.min(canvas.height - PADDLE_H, playerY + 30); break;
      case ' ': isPaused = !isPaused; break;
    }
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    playerY = e.clientY - rect.top - PADDLE_H/2;
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_H, playerY));
  });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    playerY = e.touches[0].clientY - rect.top - PADDLE_H/2;
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_H, playerY));
  });

  document.addEventListener('keydown', handleKey);
  resetBall(); draw();
  gameLoop = setInterval(update, 1000/60);

  return { destroy() { clearInterval(gameLoop); document.removeEventListener('keydown', handleKey); } };
}