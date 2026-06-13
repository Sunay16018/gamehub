function initSpaceinvaders(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 600; canvas.height = 500;

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="siScore">0</span></div>
    <div class="lives"><i class="fas fa-heart"></i> <span id="siLives">3</span></div>
    <div class="timer">Seviye: <span id="siLevel">1</span></div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let player = { x: 280, width: 40, height: 20 };
  let bullets = [], aliens = [], particles = [];
  let score = 0, lives = 3, level = 1;
  let alienDir = 1, alienSpeed = 0.5;
  let gameLoop = null, isGameOver = false, isPaused = false;

  function initAliens() {
    aliens = [];
    const rows = Math.min(3 + level, 6), cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: 60 + c * 55, y: 40 + r * 40,
          width: 35, height: 25,
          type: r % 3
        });
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % canvas.width;
      const y = (i * 53 + Date.now() * 0.01) % canvas.height;
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10;
    ctx.fillRect(player.x, canvas.height - 40, player.width, player.height);
    ctx.beginPath(); ctx.moveTo(player.x + 20, canvas.height - 50); ctx.lineTo(player.x + 10, canvas.height - 40); ctx.lineTo(player.x + 30, canvas.height - 40); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fbbf24';
    bullets.forEach(b => { ctx.fillRect(b.x - 2, b.y, 4, 10); });

    aliens.forEach(a => {
      ctx.fillStyle = ['#ef4444', '#22c55e', '#a855f7'][a.type];
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 5;
      ctx.fillRect(a.x, a.y, a.width, a.height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(a.x + 8, a.y + 8, 6, 6);
      ctx.fillRect(a.x + 22, a.y + 8, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(a.x + 10, a.y + 10, 2, 2);
      ctx.fillRect(a.x + 24, a.y + 10, 2, 2);
      ctx.shadowBlur = 0;
    });

    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
  }

  function update() {
    if (isPaused || isGameOver) return;

    bullets = bullets.filter(b => {
      b.y -= 6;
      for (let i = aliens.length - 1; i >= 0; i--) {
        const a = aliens[i];
        if (b.x > a.x && b.x < a.x + a.width && b.y > a.y && b.y < a.y + a.height) {
          for (let j = 0; j < 8; j++) {
            particles.push({
              x: a.x + a.width/2, y: a.y + a.height/2,
              vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
              size: Math.random() * 4 + 2, color: ['#ef4444','#22c55e','#a855f7'][a.type],
              life: 30
            });
          }
          aliens.splice(i, 1);
          score += [10, 20, 30][a.type];
          document.getElementById('siScore').textContent = score;
          return false;
        }
      }
      return b.y > 0;
    });

    let hitEdge = false;
    aliens.forEach(a => {
      a.x += alienDir * alienSpeed;
      if (a.x <= 0 || a.x + a.width >= canvas.width) hitEdge = true;
    });

    if (hitEdge) {
      alienDir *= -1;
      aliens.forEach(a => { a.y += 20; });
    }

    if (aliens.some(a => a.y + a.height >= canvas.height - 40)) {
      lives = 0;
      document.getElementById('siLives').textContent = lives;
      gameOver(); return;
    }

    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      return p.life > 0;
    });

    if (aliens.length === 0) {
      level++;
      alienSpeed += 0.2;
      document.getElementById('siLevel').textContent = level;
      initAliens();
    }

    draw();
  }

  function shoot() {
    bullets.push({ x: player.x + player.width/2, y: canvas.height - 50 });
  }

  function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 40px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '24px Inter';
    ctx.fillText(`Skor: ${score}`, canvas.width/2, canvas.height/2 + 30);
    if (typeof saveScore === 'function') saveScore('spaceinvaders', score);
  }

  function handleKey(e) {
    if (isGameOver) return;
    switch(e.key) {
      case 'ArrowLeft': player.x = Math.max(0, player.x - 15); break;
      case 'ArrowRight': player.x = Math.min(canvas.width - player.width, player.x + 15); break;
      case ' ': if (!isPaused) shoot(); break;
      case 'p': isPaused = !isPaused; break;
    }
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width/2;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  });

  canvas.addEventListener('click', shoot);
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    player.x = touch.clientX - rect.left - player.width/2;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    shoot();
  });

  document.addEventListener('keydown', handleKey);
  initAliens(); draw();
  gameLoop = setInterval(update, 1000/60);

  return { destroy() { clearInterval(gameLoop); document.removeEventListener('keydown', handleKey); } };
}