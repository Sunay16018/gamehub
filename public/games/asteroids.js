function initAsteroids(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = 700; canvas.height = 500;

  const ui = document.createElement('div');
  ui.className = 'game-ui';
  ui.innerHTML = `
    <div class="score">Skor: <span id="astScore">0</span></div>
    <div class="lives"><i class="fas fa-heart"></i> <span id="astLives">3</span></div>
    <div class="timer">Seviye: <span id="astLevel">1</span></div>
  `;
  container.appendChild(ui);
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let ship = { x: 350, y: 250, angle: 0, vx: 0, vy: 0, radius: 12 };
  let asteroids = [], bullets = [], particles = [];
  let score = 0, lives = 3, level = 1;
  let keys = {}, gameLoop = null, isGameOver = false, isPaused = false;

  function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      } while (Math.hypot(x - ship.x, y - ship.y) < 100);

      asteroids.push({
        x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 25 + Math.random() * 20,
        vertices: 8 + Math.floor(Math.random() * 5)
      });
    }
  }

  function draw() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      ctx.fillRect((i * 73) % canvas.width, (i * 37) % canvas.height, 1, 1);
    }

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(15, 0); ctx.lineTo(-10, -8); ctx.lineTo(-5, 0); ctx.lineTo(-10, 8);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = '#fbbf24';
    bullets.forEach(b => {
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    });

    asteroids.forEach(a => {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < a.vertices; i++) {
        const angle = (i / a.vertices) * Math.PI * 2;
        const r = a.radius * (0.8 + Math.random() * 0.4);
        const x = a.x + Math.cos(angle) * r;
        const y = a.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    });

    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
  }

  function update() {
    if (isPaused || isGameOver) return;

    if (keys['ArrowLeft']) ship.angle -= 0.08;
    if (keys['ArrowRight']) ship.angle += 0.08;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * 0.15;
      ship.vy += Math.sin(ship.angle) * 0.15;
      particles.push({
        x: ship.x - Math.cos(ship.angle) * 15, y: ship.y - Math.sin(ship.angle) * 15,
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        size: 2, color: '#f97316', life: 15
      });
    }

    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx; ship.y += ship.vy;

    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;

    bullets = bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;

      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          score += Math.floor(100 / a.radius * 10);
          document.getElementById('astScore').textContent = score;

          for (let j = 0; j < 10; j++) {
            particles.push({
              x: a.x, y: a.y,
              vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
              size: Math.random() * 4 + 2, color: '#888', life: 30
            });
          }

          if (a.radius > 15) {
            for (let k = 0; k < 2; k++) {
              asteroids.push({
                x: a.x, y: a.y,
                vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                radius: a.radius / 2, vertices: a.vertices
              });
            }
          }

          asteroids.splice(i, 1);
          return false;
        }
      }

      return b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height;
    });

    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      if (a.x < -a.radius) a.x = canvas.width + a.radius;
      if (a.x > canvas.width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = canvas.height + a.radius;
      if (a.y > canvas.height + a.radius) a.y = -a.radius;

      if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.radius + ship.radius) {
        lives--;
        document.getElementById('astLives').textContent = lives;
        if (lives <= 0) { gameOver(); return; }
        ship.x = 350; ship.y = 250; ship.vx = 0; ship.vy = 0;
      }
    });

    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
      return p.life > 0;
    });

    if (asteroids.length === 0) {
      level++;
      document.getElementById('astLevel').textContent = level;
      spawnAsteroids(3 + level);
    }

    draw();
  }

  function shoot() {
    bullets.push({
      x: ship.x + Math.cos(ship.angle) * 15,
      y: ship.y + Math.sin(ship.angle) * 15,
      vx: Math.cos(ship.angle) * 7,
      vy: Math.sin(ship.angle) * 7
    });
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
    if (typeof saveScore === 'function') saveScore('asteroids', score);
  }

  function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === ' ' && !isPaused) { e.preventDefault(); shoot(); }
    if (e.key === 'p') isPaused = !isPaused;
  }
  function handleKeyUp(e) { keys[e.key] = false; }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  spawnAsteroids(4); draw();
  gameLoop = setInterval(update, 1000/60);

  return { destroy() { clearInterval(gameLoop); document.removeEventListener('keydown', handleKeyDown); document.removeEventListener('keyup', handleKeyUp); } };
}